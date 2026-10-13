# Latvian scooter feeds

Verified 13 October 2026. The audit started from the
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
which lists Ride Mobility's Riga feed and nextbike's Latvian one, then probed
ids 1 to 400 on Ride Mobility's ATOM Mobility host, one request a second. The
Riga feed was polled six times, five minutes apart, from 03:56 to 04:21 Riga
time on a Tuesday night: positions changed between polls, and every feed URL is
https, on the discovery's origin and under its directory. No account
credentials or private rider APIs are used.

| Operator | City | Available scooters |
| --- | --- | ---: |
| Ride Mobility | Rīga | 695 |

The bounds, discovery URL and aliases are in
[`latvian-scooter-feeds.json`](../data/latvian-scooter-feeds.json).

## New provider

**Ride Mobility** (`ride_mobility`, Riga) is RIDE SIA, whose app is "RIDE:
Mobility Solutions" and whose site is [ridemobility.eu](https://ridemobility.eu/).
It runs on ATOM Mobility, as Hoppy does, and publishes GBFS 3.0 on
`rideride.rideatom.com`.

- **Name:** "Ride Mobility", not "RIDE", so that neither the screen nor
  VoiceOver confuses it with Ryde, the Norwegian operator the app already
  shows.
- **Initials:** RM, where Ryde has R.
- **Colour:** `#b21f5a`, a raspberry red, since Ride's brand red is too close
  to Zeus's. White initials on it have a contrast of 6.5, and it has a
  contrast of 3.0 against the dark map. Its nearest provider colour is Voi's
  pink, at a CIEDE2000 distance of 17, and 13 or more with colour blindness
  simulated. Ryde's green is 15 away for deuteranopes and further otherwise.
- **System ids** start with `ride_mobility`, which no other provider's prefix
  matches.

## Data handling

- **Bounds:** Ride's geofencing feed has 353 zones, 104 of which allow a
  ride to start. 87 of those cover Riga and its edges, Mārupe among them; the
  other 17 are in Jūrmala and Jelgava. The bounds are the 87 Riga zones plus
  0.005° of latitude and 0.01° of longitude, about 550 to 600 m, so they leave
  out Jūrmala and Jelgava, where no scooter stood (see
  [Known gaps](#known-gaps)). Every scooter of the six polls stood inside them,
  between 56.876° and 57.034° N and between 23.898° and 24.322° E.
- **Freshness:** like Hopp and Hoppy, ATOM stamps each response with the time
  it was asked for (`ttl` 0), so the fifteen-minute age limit can't tell how
  old the positions are. Over the night polls the count went from 697 to
  695. Between two polls, up to four scooters moved by 5 to 8 m, and one to
  three were rented or came back, one of them 1.9 km from where it had stood.
  The liveness rests on those few moves, as Hopp Kiruna's does; a daytime
  recheck would settle it. The survey of the evening before had seen 16 to 19
  positions change over 80 minutes.
- **Vehicle types:** the feed lists one standing scooter type and eight
  electric-assist bicycle types. Besides the scooters, only the Yadea Q20
  (type 582, about 940 vehicles, typed as bicycles) was out on the night. The
  app keeps electric standing scooters only.
- **Prices:** EUR 0.29 to start and EUR 0.22 a minute, from the pricing feed.
  The scooters' plan is still named "Tuul Riga": Tuul, an Estonian operator,
  sold its scooter business to Ride in September 2025
  ([ERR](https://news.err.ee/1609798302/estonia-s-tuul-sells-scooter-rental-business-to-latvian-company)).
- **Battery:** the feed gives range only, so the scooters show no battery
  level.
- **Rental links:** each scooter links to its own `ridemobility.app.link`
  address, which opens it in Ride's app. The app accepts links on
  `ridemobility.app.link` and `ridemobility.eu` only, so neither Hoppy's links
  nor Ryde's pass for Ride's.
- **IDs:** ATOM gives a scooter a new `vehicle_id` after a ride, and now and
  then while it stands still: the scooter that came back 1.9 km away had a new
  id, and so did one that hadn't moved. The number at the end of the rental
  link stayed the same in both cases, so the link names the scooter past its
  rotating id, which is why the app strips the IMEI from Ryde's links. The app
  keeps Ride's links, as it keeps Hoppy's, which have the same form: without
  the number the button only opens the app.

## Night bans

No covered Latvian town bans renting at night, so
[`rental-curfews.json`](../data/rental-curfews.json) has no Latvian entry.

- **Riga:** the city's binding regulations on shared vehicles,
  [RD-24-261-sn](https://likumi.lv/ta/id/350955) (adopted 27 March 2024, in
  force from 1 May 2024, amended by RD-25-326-sn on 26 March 2025), set speed
  limit zones and no-parking zones, published on the city's
  [GeoRīga](https://www.georiga.eu) portal. They set no hours and no fleet cap.
- **National rules:** since 1 April 2026, shared scooters may be rented from
  the age of 18 only, after an alcohol test
  ([LSM](https://eng.lsm.lv/article/economy/transport/01.04.2026-new-e-mobility-riding-rules-in-force-from-april-1st-in-latvia.a641055/),
  secondary). They set no hours.
- Bolt stops its scooters on New Year's night of its own accord. That is not a
  rule, and Bolt is not on the map.

## Licences

- **Ride Mobility** publishes no `license_url`, as Voi in Antwerpen and Hoppy
  don't. Its `system_information` gives a contact address only. The map's
  credits name Ride Mobility under the GBFS line.

## Known gaps

- **Ride Mobility, other towns:** Ride's site lists Jūrmala and Mārupe besides
  Riga. Mārupe's zones are within the Riga bounds. Jūrmala's zones held 8 of
  the Yadea Q20s and no scooter on the night, and Jelgava's nothing, so neither
  is a town of its own on the map. Of ids 1 to 400 on Ride's ATOM host, probed
  one a second without being refused, only Riga's (27) answers; the others
  belong to other ATOM operators or to no public system. So no feed was found
  for Jūrmala, nor for Ride's towns in Estonia and Lithuania (Tallinn, Vilnius,
  Kaunas).
- **Bolt** runs scooters in 16 Latvian towns, Riga among them, with no public
  feed. Its only public scooter feeds in Europe are Brussels and Liverpool.
- **Skok** (SIA Eterna Elect) publishes no feed.
- **nextbike** Latvia is in the registry, but empty.
- **Public data:** Latvia's national access point,
  [transportdata.gov.lv](https://transportdata.gov.lv), lists no shared-mobility
  data.
- Ride's Yadea Q20s, typed as electric-assist bicycles and the larger part of
  its Riga fleet, are left out: the map shows standing scooters only.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=LV --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
