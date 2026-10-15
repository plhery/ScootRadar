# Emirati scooter feeds

Verified 15 October 2026. The United Arab Emirates' usable feeds are Dott's:
its `dubai`, `dubai-hills` and `abu-dhabi` regions at
`gbfs.api.ridedott.com`, GBFS 2.3. All three are in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
and in [Dott's Emirati listing](https://gbfs.api.ridedott.com/public/v2/countries/ae/gbfs.json),
which also names Sharjah and Ras Al Khaimah (see [Known gaps](#known-gaps)).
Every feed was polled on Thursday 15 October 2026, Gulf time: every five
minutes from 10:27 to 10:54, 16:26 to 16:52 and 18:30 to 20:56 (to 21:37 for
Abu Dhabi), every 20 minutes between, and 16 times more five minutes apart
from 21:44 to 23:01, before the commit. Every feed URL is https, on the
discovery's origin and under its directory. No account credentials or private
rider APIs are used. The catalog is
[`emirati-scooter-feeds.json`](../data/emirati-scooter-feeds.json); what is
left out, and when to look again, is in [Coverage gaps](coverage-gaps.md).

| Operator | Feed | City | Available scooters, last poll (lowest–highest) |
| --- | --- | --- | ---: |
| Dott | `dubai` | Dubai | 1,649 (1,630–1,683) |
| Dott | `dubai-hills` | Dubai | 93 (86–99) |
| Dott | `abu-dhabi` | Abu Dhabi | 616 (600–634) |

Dott gives a scooter a new id after each trip, so rides were counted as an
unseen id turning up more than 300 m from every scooter that vanished in the
half hour before, or near one with at least 1.5 km less range; staff drops of
three or more scooters at one spot, and scooters put out fully charged, don't
count. In the day, Dubai had about 768 rides, Dubai Hills about 46 and Abu
Dhabi about 93: about 0.47, 0.49 and 0.15 rides a scooter. In the last 16
polls, from 21:44 to 23:01, Dubai had about 130 more, Dubai Hills 6 and Abu
Dhabi 28.

## Dubai's two fleets

Dott runs Dubai Hills Estate as a region of its own, with its own feed,
scooters and prices. No id and no position within 5 m was in both feeds in
any poll, so the two are separate fleets, and both count under the town
Dubai: the map shows one Dubai, its total adds the two, and each scooter shows
its own fleet's price. Dubai Hills' bounds lie inside Dubai's.

The `dubai` feed also holds 12 or 13 scooters in Hatta, Dubai's exclave in
the Hajar mountains, 100 km from the city. None moved or changed id in the
whole day, so Hatta is left out: its scooters stand outside Dubai's bounds,
and it is to be checked again on a cool-season Saturday.

## Abu Dhabi

Dott's Abu Dhabi feed draws one zone over the whole emirate, where a ride
may go anywhere but must end at one of Dott's stations, and 14 small zones,
most of them around Khalifa City and Masdar, where it may end anywhere. At
the last poll only 30 of 616 scooters stood in the small zones; the rest
stood across the island and its neighbours, in the emirate-wide zone alone.
So the bounds join the 14 small zones and the scooters' extent, each widened
by about 1 km. The same feed holds 16 to 18 scooters in Al Ain, which had 2
rides in the day and are left out, and a stray or two in Al Quoz, Dubai; both
stand outside Abu Dhabi's bounds.

## City names

The map names the cities Dubai and Abu Dhabi, as the feeds do, and search
also finds them in Arabic. Arabic is matched without its hamza and marks, so
أبوظبي is also found typed as ابوظبي.

| City | Also found as |
| --- | --- |
| Dubai | دبي |
| Abu Dhabi | أبوظبي, أبو ظبي, Abu Zabi |

Zoomed out, the Emirates' total stands inland between Abu Dhabi and Dubai,
south of Ghantoot (24.7° N, 54.9° E), halfway between the two cities'
scooters. It stands 138 points from Saudi Arabia's total at zoom 4, and 69 at
zoom 3.

## Data handling

- **Bounds:** Dubai's ride zones are no guide: one of them spans the whole
  emirate, Hatta included. So Dubai's bounds are its scooters' extent, without
  Hatta, widened by about 1 km: from 25.0536° to 25.2925° N and from 55.1151°
  to 55.5142° E. Every scooter of the last 16 polls in Dubai, Hatta's apart,
  stood inside them, between 25.0625° and 25.2835° N and 55.1252° and
  55.5042° E. Dubai Hills' are its one ride zone plus 1 km, from 25.0797° to
  25.1268° N and 55.2242° to 55.2674° E. Abu Dhabi's 14 small ride zones
  reach from 24.4069° to 24.5094° N and 54.4079° to 54.6100° E; with the
  scooters' extent, and 1 km around both, the bounds are 24.3979° to
  24.5216° N and 54.3070° to 54.6349° E. Every scooter of the last 16 polls
  in Abu Dhabi stood inside them, between 24.4091° and 24.5126° N and
  54.3169° and 54.6250° E.
- **Freshness:** Dott stamps each response with the time it was built, which
  was 0 to 127 seconds old at every poll; the cache drops a feed older than
  15 minutes. Each vehicle's `last_reported` is a heartbeat, a median 8
  minutes old.
- **Vehicle types:** Dott's standing scooters (`dott_scooter`, 30 km of
  range), which the map shows. Dubai's feed also lists about 40 e-bikes, and
  Dubai Hills' has e-bike and bicycle types; the map leaves them out. Abu
  Dhabi lists scooters only. No vehicle of the last 16 polls was reserved or
  disabled.
- **Prices:** from the pricing feeds, in dirhams: AED 3.50 to unlock and AED
  1.50 a minute in Dubai, AED 3.00 and AED 1.20 in Dubai Hills, AED 3.20 and
  AED 1.20 in Abu Dhabi. The app writes "AED 3.50" in English, in Safari and
  Chrome alike. It has no Arabic, so a browser set to Arabic (ar-AE) gets the
  English app, with the Emirates' way of writing numbers: "AED 3.50", not the
  Arabic "3.50 د.إ.". Unit tests cover both fleets' prices.
- **Battery:** the feeds give each scooter's battery level and range.
- **Rental links:** each scooter links to Dott's app at
  `go.ridedott.com/vehicles/<id>`, for iOS and Android, as in every Dott
  region.
- **IDs:** Dott keeps an id while the scooter stands and renews it after each
  trip, and now and then in place, so the rides above were counted by
  position and range.
- **Parking:** Dott publishes virtual stations: 307 in Dubai's bounds, 7 in
  Dubai Hills and 1,358 in Abu Dhabi's. In Dubai, three zones require a
  station: two along Jumeirah Street, with the 40 Jumeirah Street and JNCT
  stations, and one at Expo City, outside the bounds. The map shows those 40
  as places a ride must end, and Dubai's other stations, and Dubai Hills', as
  suggested places. In Abu Dhabi one zone, "Abu Dhabi", which spans the
  emirate, requires a station, so a ride there ends at one of Dott's stations,
  and the map shows all of them but two as such. AD Mobility's guideline
  counts "virtual parking lots marked by signs on websites and digital
  applications" among the places scooters may park (see [Rules](#rules)).
- **Time zone:** the feeds give `Asia/Dubai`, which every area of the catalog
  sets too.
- **Load:** the scooter cache asks for each feed's `vehicle_status`, and its
  `station_status`, every 20 minutes, or every minute for 10 minutes after
  someone looks at the city, and its metadata once an hour. So the three feeds
  add about 33 requests an hour to `gbfs.api.ridedott.com`, and at most about
  125 each while watched.

## Rules

No source sets hours for renting or riding a scooter in either city, so
[`rental-curfews.json`](../data/rental-curfews.json) has no entry for the
Emirates.

- **Dubai:** the RTA's
  [e-scooter page](https://www.rta.ae/wps/portal/rta/ae/home/about-rta/escooter)
  allows scooters in listed districts and cycle tracks only, among them
  Downtown, Business Bay, Dubai Marina, JLT, Internet City, Jumeirah, City
  Walk, Al Karama and Al Mankhool, for riders of 16 or older, with a helmet and
  a reflective jacket, and says that "to ride an e-scooter in the specified
  areas, users must obtain a permit". The RTA's
  [permit service](https://www.rta.ae/wps/portal/rta/ae/home/rta-services/service-details?serviceId=141)
  (updated 24 July 2026) makes the permit free: online theory lectures, then
  a 20-question test in 30 minutes, which can be retaken. Visitors may apply
  ("If you're on a visit visa, you must apply for the permit as a tourist"),
  with their passport, and a UAE mobile number to receive the code. Holders
  of a UAE driving licence, a valid international one, or one from a country
  on the RTA's exception list need no permit. And "you must present your Driving
  Licence or e-Scooter Driving Permit to the rental company to allow you to
  rent". So a visitor without one of those licences has to pass the free
  online test before renting; the app doesn't say so, as it says nothing of
  any city's licence rules.
- **Abu Dhabi:** the Integrated Transport Centre, now AD Mobility, publishes
  the [Abu Dhabi Guideline for Safe Use of Bicycles, Electric Bicycles, and
  Scooters](https://admobility.gov.ae/-/media/project/dot/itc/files/e-library/abu-dhabi-guidelines-en.pdf)
  (ADG 28/2024, second edition, June 2024). Scooters may use cycle tracks,
  shared paths and internal roads of 40 km/h and below, not roads of 60 km/h
  and above; rental scooters are held to 20 km/h; riders wear a helmet at all
  times and reflective gear; and scooters park in authorized places, among
  them virtual parking lots in the operators' apps. The age is left to an
  administrative decision; Abu Dhabi Police give 16, with no passenger and
  20 km/h at most
  ([Gulf News](https://gulfnews.com/uae/transport/abu-dhabi-police-warn-e-scooter-riders-over-unsafe-use-1.500689146),
  26 September 2026, press). Neither sets hours.

## Licences

- **Dott:** its feeds give no `license_url`, so it publishes no data licence
  for them; its [API terms](https://ridedott.com/api-licence/) restrict
  distribution, as in Europe.
- The map's credits name Dott under the GBFS line, as "AE/SA: Dott, SAHAM".

## Known gaps

- **Hatta:** 12 or 13 scooters in Dott's Dubai feed, none ridden on a
  Thursday in October. Hatta is a weekend and cool-season place; check again
  on a Saturday from 21 November 2026.
- **Sharjah:** Dott's `sharjah` region holds 93 to 96 scooters in University
  City, which had about 7 rides in 11 hours: too few yet. Check again in late
  November 2026.
- **Ras Al Khaimah and Al Ain:** Dott's `ras-al-khaimah` (32 to 34 scooters)
  and the Al Ain part of `abu-dhabi` (16 to 18) had about 2 rides each. Check
  again in December 2026.
- **Lime, Skurtt and Arnab,** which the RTA also licenses in Dubai, publish no
  feed: about 40 of Lime's slugs for Dubai and its districts answer 404.
- **Bird** `abu-dhabi` answers, but lists no vehicle and gives a time of 0.
- **Yaldi** is gone: its ATOM Mobility host, `yaldi.rideatom.com`, no longer
  resolves, and yaldi.ae rents cars.
- **Careem BIKE,** in the registry, is docked bicycles.

## Search

The Emirates are found in the app's nine languages, and as UAE, Emirates,
الإمارات and الإمارات العربية المتحدة, typed beside a city: "Dubai UAE",
"دبي الإمارات". The country code "ae" is not a search word.

## Recheck

```bash
node scripts/check-french-feeds.mjs --countries=AE
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
