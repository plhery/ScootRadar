# Saudi scooter feeds

Verified 15 October 2026. Saudi Arabia's usable feeds are SAHAM's in Riyadh
and Dott's in Jeddah. SAHAM (سهم) runs on ATOM Mobility: system 748, named
Riyadh, at `saham.rideatom.com`, GBFS 3.0. It is not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv);
it answers at the address ATOM gives its other operators' feeds. SAHAM's app
is published by THAWABIT Rental Company. Dott's `jeddah` region, at
`gbfs.api.ridedott.com`, GBFS 2.3, is in the registry and in
[Dott's Saudi listing](https://gbfs.api.ridedott.com/public/v2/countries/sa/gbfs.json),
which also names Riyadh, Sports Boulevard, STC City and Makkah (see
[Known gaps](#known-gaps)). Every feed was polled on Thursday 15 October 2026,
Riyadh time: Jeddah every five minutes from 09:27 to 09:54, 15:26 to 15:52
and 17:30 to 20:37, and every 20 minutes between; SAHAM from 15:26 to 20:37
on the same plan; and both 16 times more five minutes apart from 20:44 to
22:01, before the commit. Every feed URL is https, on the discovery's origin
and under its directory. No account credentials or private rider APIs are
used. The catalog is
[`saudi-scooter-feeds.json`](../data/saudi-scooter-feeds.json); what is left
out, and when to look again, is in [Coverage gaps](coverage-gaps.md).

| Operator | Feed | City | Available scooters, last poll (lowest–highest) |
| --- | --- | --- | ---: |
| SAHAM | 748 | Riyadh | 218 (212–236) |
| Dott | `jeddah` | Jeddah | 171 (134–173) |

## Rides

Both operators give a scooter a new id after each trip. SAHAM's scooters keep
the number printed on them, which ends their rental link, so its trips were
traced by that number: a scooter leaving the feed and coming back under a new
id more than 500 m away, or with at least 1.2 km less range. From 15:26 to
22:01, 63 trips finished so: 4 to 8 an hour in the afternoon, 13 from 20:00
to 21:00 and 19 from 21:00 to 22:00. One scooter, 0070, came back 93 m from
where it left with 10 km less range; another, 0010, 1.6 km away with 6.4 km
less. Staff also work the fleet: at 19:35, 21 scooters were put out, and
about 50 were moved 1 to 20 km by van with the same range.

Dott's Jeddah fleet stands on one 2.5 km strip of the corniche at Al Shati.
It stood idle until 17:40, when staff put scooters out and swapped
batteries; about 20 rides followed by 20:37, most of them loops along the
corniche that end near where they started, seen as a new id with at least
1.5 km less range. In the last 16 polls, from 20:44 to 22:01, three more
scooters came back within 90 m of where they had left, 20 to 30 minutes
later, with 1.8, 13.9 and 18.5 km less range, and staff swapped six
batteries. That is few for 171 scooters, but they are ridden, so Jeddah is
in; a check on Friday 23 October, with Dott Riyadh, will tell more (see
[Coverage gaps](coverage-gaps.md#dates-to-check-again)).

## City names

The map names the cities Riyadh and Jeddah, as the feeds do, and search also
finds them in Arabic. Arabic is matched without its hamza and marks, and with
ة as ه, so جدة is also found typed as جده.

| City | Also found as |
| --- | --- |
| Riyadh | الرياض, Ar Riyad |
| Jeddah | جدة, Jiddah |

SAHAM is the name the map and its credits give the operator; its Arabic name,
سهم, is in this guide only, as providers have no alias the search reads.

Zoomed out, Saudi Arabia's total stands in Najd, south of Afif (23.2° N,
42.9° E), halfway between Riyadh and Jeddah. It stands 138 points from the
Emirates' total at zoom 4, and 69 at zoom 3.

## Data handling

- **Bounds:** SAHAM's geofencing has 89 zones: one large ride area over
  north and central Riyadh, small parking spots and no-ride areas, and outside
  them no ride may start or end. Riyadh's bounds are its ride zones plus 1 km,
  from 24.5521° to 25.0316° N and from 46.4871° to 46.8692° E. Every
  scooter of the last 16 polls stood inside them, between 24.6828° and
  24.8251° N and 46.6128° and 46.7005° E, in three groups: Tahlia and As
  Sulaymaniyah, Al Olaya and Al Ghadir, and Al Yasmin. Jeddah's are Dott's
  two ride zones, which cover the same strip of the corniche, from 21.6336°
  to 21.6571° N, plus 1 km: from 21.6246° to 21.6661° N and 39.0907° to
  39.1151° E. Every scooter of the last 16 polls stood inside them.
- **Freshness:** ATOM stamps SAHAM's responses with the time they were asked
  for (`ttl` 0) and gives no `last_reported`, as for Hoppy, Ryde and Yoio, so
  the age limit can't tell how old its positions are; the rides above, and
  positions that shift a little between polls, show the feed is live. A unit
  test covers a SAHAM response 20 minutes old, which the cache drops. Dott
  stamps each response with the time it was built, 2 to 107 seconds old at
  every poll.
- **Vehicle types:** SAHAM lists one type, `994`, a standing electric scooter
  (`scooter_standing`) with 40 km of range. Dott's Jeddah feed has a type
  for e-bikes too, but listed only scooters (`dott_scooter`); the map shows
  scooters only. No vehicle of the last 16 polls was reserved or disabled.
- **Prices:** from the pricing feeds, in riyals: SAHAM SAR 0 to unlock and
  SAR 1.00 a minute, so the card says "No unlock fee"; Dott Jeddah SAR 3.00
  and SAR 2.50 a minute. Safari writes the riyal with its new sign, ⃁
  (U+20C1), as "⃁ 1.00", on the Mac and the iPhone, and so does the iOS app
  in the card's note, while the label under its ten-minute figure names SAR;
  Chrome writes "SAR 1.00". On screen, in Safari on iOS 27 and in WebKit and
  Chromium on macOS, the sign is drawn, not a box. The app has no Arabic, so a
  browser set to Arabic gets the English app, with the region's way of
  writing numbers. Unit tests cover both prices.
- **Battery:** SAHAM gives range only (`current_range_meters`), so its
  scooters show their range and no battery level; Dott gives both.
- **Rental links:** each SAHAM scooter links to its own
  `ride-saham.app.link` address, which opens it in SAHAM's app. The link ends
  in the four-digit number printed on the scooter, such as 0131, not a
  hardware id, so the app keeps it; SAHAM's web link is
  `https://ride-saham.app.link/`. The app accepts SAHAM's links on that host,
  and on `sahamofficial.com`, and no other operator's. Dott's links go to
  `go.ridedott.com/vehicles/<id>`, as in every Dott region.
- **IDs:** SAHAM's and Dott's ids change after each trip. SAHAM's printed
  numbers, 0001 to 0300, stayed the same through every trip.
- **Parking:** SAHAM publishes no stations; its parking spots are geofencing
  zones, which the map doesn't draw. Dott publishes 33 virtual stations in
  Jeddah, which no zone requires, so the map shows them as suggested places.
- **Time zone:** both feeds give `Asia/Riyadh`, which every area of the
  catalog sets too; SAHAM gives opening hours of `24/7`.
- **Load:** the scooter cache asks for each feed's `vehicle_status` every 20
  minutes, or every minute for 10 minutes after someone looks at the city,
  and its metadata once an hour, and Dott's `station_status` with it. So
  Riyadh adds about 8 requests an hour to `saham.rideatom.com`, and at most
  about 65 while it is watched; the cache paces every ATOM host to two
  requests a second. Jeddah adds about 11 to `gbfs.api.ridedott.com`.

## Rules

No source sets hours for renting or riding a scooter, so
[`rental-curfews.json`](../data/rental-curfews.json) has no entry for Saudi
Arabia. The Ministry of Municipalities and Housing's requirements for shared
bicycles and scooters, posted on the government's "Survey" platform
(Istitlaa), where draft rules are put out for comment, set riders' minimum
age at 17, keep scooters off "public roads, streets, and non-designated
tracks", and say they "must not be deployed outside authorized areas"
([Gulf News](https://gulfnews.com/world/gulf/saudi/saudi-arabia-sets-stricter-rules-for-bike-and-scooter-rentals-1.1729934659745),
26 October 2024, press). Whether they are in force is not stated, and no
primary source was found.

## Licences

- **SAHAM:** its feed gives no `license_url`, so it publishes no data licence,
  as the other ATOM operators in the app.
- **Dott:** its feed gives no `license_url` either; its
  [API terms](https://ridedott.com/api-licence/) restrict distribution, as in
  Europe.
- The map's credits name both under the GBFS line, as "AE/SA: Dott, SAHAM".

## Known gaps

- **Dott Riyadh:** 93 to 99 scooters, all in Boulevard City, a Riyadh Season
  venue, and about 10 rides in 12.5 hours. Riyadh Season opens on 21 October
  2026; check again from Friday 23 October, in the evening.
- **Dott Sports Boulevard** (`sbf`): 44 or 45 scooters and about 85 e-bikes
  at one spot, which never moved. **Dott STC City:** empty, with a free plan,
  on the stc headquarters campus: not a public service.
- **Dott Makkah:** empty, with a free plan, over the holy sites; it may run
  in the Hajj. Check again from 15 to 30 May 2027.
- **SAHAM's other systems:** 1122 and 1383 on `saham.rideatom.com` answer
  "GBFS disabled".
- **No public feed:** Wing, Barqscoot and SPIDERS; Green Arrows, on ATOM
  Mobility, has no host that answers.
- **open.data.gov.sa,** the national open-data portal, did not answer.

## Search

Saudi Arabia is found in the app's nine languages, and as Saudi, KSA,
السعودية and المملكة العربية السعودية, typed beside a city: "Riyadh KSA",
"جدة السعودية". The country code "sa" is not a search word.

## Recheck

```bash
node scripts/check-french-feeds.mjs --countries=SA
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
