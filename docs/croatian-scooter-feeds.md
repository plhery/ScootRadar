# Croatian scooter feeds

Verified 13 and 14 October 2026. Croatia's only usable feed is Hoppy's, in
Rijeka. The
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
lists 22 Croatian systems, all nextbike's, and no Hoppy. Hoppy Rijeka is
system 2304 on ATOM Mobility's `hoppy.rideatom.com`, the platform and host of
Hoppy Kortrijk, found by a scan of ATOM's ids. It was polled 11 times about
five minutes apart from 22:56 to 23:43 on Tuesday 13 October, Zagreb time,
then 4 more times five minutes apart from 23:49 to 00:04. Every feed URL is
https, on the discovery's origin and under its directory. No account
credentials or private rider APIs are used.

| Operator | Town | Available scooters | Polled |
| --- | --- | ---: | --- |
| Hoppy | Rijeka | 232 to 243 | 22:56 to 00:04, at night |

Rijeka had 9 rides traced by the code printed on each scooter, of 0.5 to
2.3 km. From 22:56 to 23:43, 7 scooters left and came back under a new id 1.1
to 2.3 km away, with 3.6 to 18 km less range: four of them left one spot
together between 23:17 and 23:32 and stood together again by 23:38, a group
ride, and the other three rode alone. From 23:49 to 00:04, two more came back
0.5 and 0.8 km away, with 1.2 and 3.6 km less range, and three others were
out at the last poll. Every scooter stood in the same 4.4 by 8.8 km of the
city in every poll. The bounds, discovery URL and alias are in
[`croatian-scooter-feeds.json`](../data/croatian-scooter-feeds.json).

Rijeka chose its operator by a public call, published on 30 June 2026, for 300
scooters at 32 locations, for three years from the third quarter of 2026
([City of Rijeka](https://www.rijeka.hr/objavljen-javni-poziv-za-uslugu-iznajmljivanja-e-romobila-na-podrucju-grada-rijeke-4/)).
Hoppy Mobility d.o.o. was the only bidder
([Fiuman](https://www.fiuman.hr/na-rijecke-ulice-uskoro-stize-300-hoppy-romobila-poznata-je-i-cijena-voznje/),
5 August 2026, press) and started in the week of 11 September 2026
([City of Rijeka](https://www.rijeka.hr/novi-koncesionar-pokrenuo-uslugu-dijeljenih-e-romobila-u-rijeci-dostupni-na-32-lokacije/)).

## Town name

The map names the town Rijeka, as Hoppy's feed does, and search also finds it
by its Italian name, Fiume.

| Town | Also found as |
| --- | --- |
| Rijeka | Fiume |

Zoomed out, a country's total usually stands inland, about the middle of the
country. Croatia's stands near Slunj (45.2° N, 15.5° E), about the middle of
the country's crescent, 85 km east of Rijeka. Rijeka itself is on the coast,
20 km from Slovenia and 60 km from Trieste: zoomed out to Europe, a total
there sits where Slovenia, Italy and Croatia meet. Croatia lies between Italy's
total (43° N, 12.5° E) and Hungary's (47.2° N, 19.5° E), so no point of it is
far from both. Near Slunj, Croatia's stands 49 points from Italy's and 56 from
Hungary's at zoom 4, and 24 and 28 at zoom 3; Karlovac would give 53 and 53,
and Zagreb 60 and 46. Spain's and Portugal's stand 64 points apart at zoom 4
and 32 at zoom 3.

## Data handling

- **Bounds:** Hoppy's geofencing marks 71 parking zones for the scooter type,
  where a ride may start and end, and 2 zones where it may not be ridden: a
  small one in the centre, and one from 45.298° to 45.381° N and from 14.328°
  to 14.511° E, which has no hole and covers the whole town, as ATOM exports
  an operating area. So the bounds are the parking zones, from 45.3131° to
  45.3537° N and from 14.363° to 14.4795° E, plus 0.005° of latitude and 0.01°
  of longitude, about 550 m north and south and 780 m east and west. Every
  scooter of the 15 polls stood inside them, between 45.3140° and 45.3536° N
  and 14.3671° and 14.4796° E, the farthest 5.8 km from the median.
- **Freshness:** ATOM stamps each response with the time it was asked for
  (`ttl` 0) and gives no `last_reported`, as for Hoppy Kortrijk, so the age
  limit can't tell how old its positions are; the rides above show the feed is
  live.
- **Vehicle types:** one, `4152`, an electric standing scooter with 60 km of
  range. No scooter of the polls was reserved or disabled.
- **Prices:** from the pricing feed, in euros: one plan, `4152`, at EUR 0 to
  start and EUR 0.19 a minute, which every scooter is on. The press gave other
  prices: EUR 1 to start and EUR 0.25 a minute in Hoppy's offer to the city,
  and no start fee and EUR 0.10 a minute in the launch offer for European
  Mobility Week, 16 to 22 September 2026
  ([Teklić](https://teklic.hr/rijeka-regija/e-romobili-se-vracaju-u-rijeku-300-novih-vozila-uz-stroga-pravila-parkiranja-i-voznju-od-10-centi-po-59442),
  11 September 2026). The map shows the feed's price, as Hoppy publishes it
  now; a unit test covers it.
- **Battery:** the feed gives range only (`current_range_meters`, 7.2 to
  54 km), so the scooters show their range and no battery level.
- **Rental links:** each scooter links to its own `ride-hoppy.app.link`
  address, as in Kortrijk, which opens it in Hoppy's app. The link ends in the
  six-digit number printed on the scooter, not a hardware id, so the app keeps
  it.
- **IDs:** ATOM gives a scooter a new `vehicle_id` after each ride, and now and
  then while it stands still: one changed id 32 m from where it stood. The
  number at the end of the rental link stayed the same through every ride, so
  rides were traced by it; all 943 links of the 4 later polls end in six
  digits, one number per scooter.
- **Parking:** Hoppy publishes no stations, so the map shows none. Every
  ride must end, with a photo, in one of its parking zones, 32 at the launch
  and 71 in the feed now, which its app shows.
- **Time zone:** the feed gives `Europe/Zagreb` and opening hours `24/7`.
  Neither the app nor the scooter cache reads `system_information`.
- **Load:** the scooter cache asks for Rijeka's `vehicle_status` every 20
  minutes, or every minute for 10 minutes after someone looks at the town, and
  its discovery, vehicle types, prices, stations and geofencing once an hour.
  So Rijeka adds about 8 requests an hour to `hoppy.rideatom.com`, and at most
  about 65 while it is watched; the cache paces every ATOM host to two requests
  a second.

## Night bans

No rule of Rijeka bans renting at night, and none was found in Croatian
traffic rules, so [`rental-curfews.json`](../data/rental-curfews.json) has no
Croatian entry.

- **Rijeka's call** asks for service at least from 06:00 to 22:00 and gives a
  point more for service at night ("trajanje dnevne usluge: od 6 do 22 sata;
  usluga noću: + 1 bod", annex 4,
  [Dodatni elementi za ocjenjivanje ponude](https://www.rijeka.hr/wp-content/uploads/2026/06/Prilog-4-Dodatni-elementi-za-ocjenjivanje-ponude.docx)).
  The call's page
  ([call](https://www.rijeka.hr/bidding/javni-poziv-za-prikupljanje-ponuda-za-uslugu-iznajmljivanja-e-romobila-na-podrucju-grada-rijeke-3/),
  under the mayor's conclusion of 5 May 2026) and annex 3, on the service the
  city requires, set no hours; the call's own text, a scanned PDF, wasn't
  read. Hoppy's offer runs
  the service all day ("usluga će biti dostupna cjelodnevno",
  [Fiuman](https://www.fiuman.hr/na-rijecke-ulice-uskoro-stize-300-hoppy-romobila-poznata-je-i-cijena-voznje/),
  press), its feed gives `24/7`, and its scooters were ridden after 23:00.
- **Croatian traffic rules,** as Teklić sums them up for Rijeka's riders, set
  an age of 14, a helmet, and a reflective vest at night and in poor
  visibility ("noću i u uvjetima smanjene vidljivosti obavezno je nošenje
  reflektirajućeg prsluka"): they provide for riding at night rather than ban
  it. The road traffic act itself wasn't read for this audit.

## Licences

- **Hoppy:** its Rijeka feed gives no `license_url`, so it publishes no data
  licence, as in Kortrijk.
- The map's credits name Hoppy under the GBFS line.

## Known gaps

- **Hopp Omiš** (`api.hopp.bike/gbfs/hr-omis`) held 11 scooters, all disabled,
  at night and on the evening of 13 October 2026, and again near midnight.
  Check it in spring.
- **Hoppy Crikvenica** (ATOM id 2302) answers, with three scooter types, but
  listed no scooter at 18:50 or near midnight on 13 October 2026. Hoppy
  started there this season, at 14 locations from Dramalj to Selce
  ([Fiuman](https://www.fiuman.hr/hoppy-romobili-postavljeni-na-14-lokacija-u-crikvenici-i-okolici-uskoro-ih-300-stize-i-u-rijeku/),
  18 August 2026). Check it in spring, and add it if it holds ten or more
  scooters and they are ridden.
- **nextbike:** the country feed, `nextbike_hr`, holds 2 docked scooters, one
  each at Vodnjan and Svetvinčenat, in Istria; too few for the map. The
  registry's other 21 Croatian entries are nextbike's town systems.
- **Public data:** Croatia's national access point,
  [promet-info.hr](https://www.promet-info.hr/), run by Hrvatske ceste, lists
  road and traffic data, not shared vehicles.
- Bolt's only public scooter feeds in Europe are Brussels and Liverpool.

## Search

Croatia is found in the app's nine languages and as Hrvatska, typed beside a
town. Rijeka is also found as Fiume.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=HR --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
