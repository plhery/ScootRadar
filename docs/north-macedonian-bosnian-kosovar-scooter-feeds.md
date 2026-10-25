# North Macedonian, Bosnian and Kosovar scooter feeds

Verified 25 October 2026. None of the three countries has a public scooter
feed: no GBFS from any operator, none in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
and no city publishes positions. BinBin, the Turkish operator whose app map
the cache already sweeps in Turkey, runs scooters in Skopje, Sarajevo and
Pristina, and its app shows them to riders who have not signed in. The cache
reads that map the same way: one service area a city, swept ten nearest
scooters at a time until every point of it is proven complete.
[The collector's guide](binbin-app-map.md) explains how.

On the afternoon of Sunday 25 October 2026 the sweeps found:

| City | Country | Scooters | Requests | Seconds |
| --- | --- | ---: | ---: | ---: |
| Sarajevo | Bosnia and Herzegovina | 767 | 236 | 59 |
| Skopje | North Macedonia | 591 | 200 | 50 |
| Pristina | Kosovo | 372 | 126 | 32 |
| **All 3** | | **1,730** | **562** | **141** |

Swept again 17 minutes later, at 15:33 UTC, they held 766, 592 and 378. In
between, 29 scooters had moved at least 50 m (11 in Sarajevo, 6 in Skopje and
12 in Pristina), 12 had left the list, as a scooter does while it is ridden,
and 18 had joined it. The battery of 303 had fallen, those standing still too.

The systems, their outlines' bounds and their areas' ids are in
[`north-macedonian-scooter-feeds.json`](../data/north-macedonian-scooter-feeds.json),
[`bosnian-scooter-feeds.json`](../data/bosnian-scooter-feeds.json) and
[`kosovar-scooter-feeds.json`](../data/kosovar-scooter-feeds.json), the
outlines in [`binbin-areas.json`](../data/binbin-areas.json), with Turkey's.
Each system is one of BinBin's active service areas, in the cities its
[locations page](https://www.binbin.tech/lokasyonlar/) lists; its other
Balkan cities are in the known gaps.

## Town names

BinBin names its areas in Turkish: Skopje, Saraybosna and Pristina. The map
names them as [GeoNames](https://www.geonames.org/) does in English, at its
city centres, and also finds them by these names:

| City | Also found as |
| --- | --- |
| Skopje | Скопје, Shkup, Üsküp |
| Sarajevo | Сарајево, Saraybosna |
| Pristina | Prishtina, Prishtinë, Priština, Приштина, Priştine |

Search ignores the marks, so Prishtinë is also found as Prishtine. The
countries are found in the app's nine languages and in their own: North
Macedonia also as Macedonia and Severna Makedonija, Bosnia and Herzegovina
also as Bosnia and Bosna i Hercegovina, Kosovo also as Kosova.

Zoomed out, each country's total stands about its middle:

| Country | Total at | Near |
| --- | --- | --- |
| North Macedonia | 41.65° N, 21.75° E | Veles, south-east of Skopje |
| Bosnia and Herzegovina | 44.17° N, 17.79° E | Travnik, north-west of Sarajevo |
| Kosovo | 42.6° N, 20.9° E | Drenas, west of Pristina |

Kosovo is `XK`, a user-assigned code that ISO 3166 does not list, which
GeoNames uses and browsers and iOS name. The time-zone
database has no zone for Kosovo: GeoNames gives Pristina `Europe/Belgrade`,
Serbia's. So the catalog gives the three towns no time zone, as other
European towns. Where the map may not use a rider's location, it opens on the
covered city nearest the main place of their time zone, within 150 km when
that zone's country has none: Skopje for `Europe/Skopje`, Sarajevo for
`Europe/Sarajevo`, but Switzerland for `Europe/Belgrade`, since Pristina is
246 km from Belgrade and Arad, the nearest covered city, 163 km.

## Data handling

As in [Turkey](turkish-scooter-feeds.md#data-handling): each system sweeps
one of BinBin's service areas, its public geofences of type 2 simplified to
within 5 m, and keeps the electric scooters inside it, whatever their
`status`, with their battery. An area is swept every two hours while nobody
looks at it, and every minute for ten minutes once someone does; each sweep
takes about a minute. The list gives no price, range or position time, and
links no scooter, so the card opens BinBin's app. Parking and zones are not
shown. The three areas add about 560 requests to BinBin's round, which the
one client paces with Turkey's (see
[pace and failures](binbin-app-map.md#pace-and-failures)).

## Night bans

[`rental-curfews.json`](../data/rental-curfews.json) has no entry for the three
countries: their cities' rules on riding at night have not been checked yet.

## Licences

- **BinBin:** publishes no data licence. The app's credits link its site as
  "TR/MK/BA/XK: BinBin map", and the API names each country's source, as
  "Kosovo: BinBin anonymous app map; city centres from GeoNames".
- **GeoNames** (city centres): CC BY 4.0, credited as "MK/BA/XK: GeoNames".

## Known gaps

- **Tirana**, in Albania: BinBin's area there held 14 scooters on 25 October
  2026, seven of them with a flat battery, and none moved, left or joined the
  list between the two sweeps. Albania would be a country for them alone, so
  it is left out. Check again in April 2027.
- **Mostar**, in Bosnia and Herzegovina: BinBin's area there held no scooter
  that day. It would be a second system in the Bosnian catalog.
- **Banja Luka**: BinBin's locations page lists it, but its area is marked
  inactive.
- **Sofia**: BinBin's locations page lists it too, but its geofences hold no
  service area there, and a request at the city centre found no BinBin
  scooter. Bolt's scooters in Sofia are on the map
  ([Bolt in Bulgaria](bolt-country-scooter-feeds.md#bulgaria)).

## Recheck

```sh
node scripts/update-binbin-areas.mjs --check
node scripts/check-french-feeds.mjs --countries=MK,BA,XK --json
```
