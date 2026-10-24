# Turkish scooter feeds

Verified 24 October 2026. Turkey has no public scooter feed: no GBFS from
BinBin, Martı or Hop, none in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
and İstanbul's, İzmir's and Konya's open-data portals hold parking and routes,
not scooters. BinBin's app shows its scooters to riders who have not signed in,
and the cache reads that map: 13 service areas in 12 cities, swept ten
nearest scooters at a time until every point of each area is proven complete.
[The collector's guide](binbin-app-map.md) explains how. Martı's and Hop's
maps need a rider session, so they are not shown; see
[the app investigation](turkish-app-maps.md).

On the afternoon of Saturday 24 October 2026 the sweeps found:

| City | Scooters |
| --- | ---: |
| İstanbul | 5,955 |
| Antalya | 2,342 |
| İzmir | 1,111 |
| Konya | 1,108 |
| Samsun | 869 |
| Bursa | 773 |
| Eskişehir | 643 |
| Kocaeli | 587 |
| Alanya | 533 |
| Sakarya | 436 |
| Adana | 377 |
| Gaziantep | 226 |
| **All 12** | **14,960** |

The systems, their outlines' bounds and their areas' ids are in
[`turkish-scooter-feeds.json`](../data/turkish-scooter-feeds.json), the outlines
in [`binbin-areas.json`](../data/binbin-areas.json). İstanbul is two of
BinBin's areas, Avrupa on the European side and Anadolu on the Asian side,
shown as one city. The areas are BinBin's active service areas in
Turkey, the cities its [locations page](https://www.binbin.tech/lokasyonlar/)
lists, less its area at İstanbul Airport (see the known gaps).

## Town names

The map names each city as BinBin does, in Turkish. Search ignores Turkish
letters' marks, so İstanbul is also found as Istanbul, İzmir as Izmir and
Eskişehir as Eskisehir. Two areas are named after their province, and also
found by their city's name:

| City | Also found as |
| --- | --- |
| Kocaeli | İzmit |
| Sakarya | Adapazarı |

Zoomed out, Turkey's total stands in Central Anatolia, south of Eskişehir
(39.4° N, 31.0° E): on land, amid BinBin's cities from İstanbul to Antalya and
Gaziantep, away from the Black Sea and the Mediterranean.

## Data handling

- **Areas:** each system sweeps one of BinBin's service areas, its public
  geofences of type 2, simplified to within 5 m. The sweep keeps the scooters
  inside the outline, and the system's bounds are the outline's.
  `scripts/update-binbin-areas.mjs` fetches them again.
- **Freshness:** a sweep's positions are as old as its start. It takes from
  under a minute in Eskişehir to a few minutes in İstanbul.
- **Vehicle types:** the map asks for type 1, electric scooters, and keeps
  only those; BinBin's bikes and mopeds are left out. Every scooter the list
  gives is shown, whatever its `status`, as BinBin's app does.
- **Battery:** each scooter's `battery`, as a percentage. The list gives no
  range.
- **Prices:** the list gives none, so the map shows no price.
- **Rental links:** the list links no scooter, so the card opens BinBin's
  app at `binbin.tech`, which its Android app claims whole. Its iPhone app
  claims only paths below the root, such as `/scooter`, so on the iPhone the
  card opens its App Store page, as for Spin.
- **Parking and zones:** not shown. Only BinBin's service areas, geofences
  of type 2, are read.
- **Time zone:** `Europe/Istanbul` for every area.
- **Load:** see [pace and failures](binbin-app-map.md#pace-and-failures).

## Night bans

[`rental-curfews.json`](../data/rental-curfews.json) has no Turkish entry:
no Turkish city's rules on riding at night have been checked.

## Licences

- **BinBin:** publishes no data licence. The app's credits link its site as
  "TR: BinBin map", and the API names the source "Turkey: BinBin anonymous
  app map".

## Known gaps

- **Martı and Hop** run scooters across Turkey; their maps refuse requests
  without a rider session. See [the app investigation](turkish-app-maps.md).
- **İstanbul Airport:** BinBin's area there, İGA, is not swept. It held two
  scooters on 24 October 2026.
- **BinBin in the Balkans:** Skopje, Sarajevo, Mostar, Pristina and Tirana
  are in the same geofences and would be swept the same way, but each is a
  new country. On 24 October 2026 a request at each found ten scooters in
  all but Mostar.

## Search

Turkey is found in the app's nine languages and as Türkiye, typed beside a
city.

## Recheck

```sh
node scripts/update-binbin-areas.mjs --check
node scripts/check-french-feeds.mjs --countries=TR --json
```
