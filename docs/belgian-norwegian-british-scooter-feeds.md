# Belgian, Norwegian and British scooter feeds

Verified 11 October 2026. The audit started from the
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
Dott's country listings, [Entur's Mobility API](https://developer.entur.no/docs/open-services/mobility)
for Norway and Beryl's own index of schemes, then probed the URL patterns of the
other operators. Each enabled feed was polled several times over an evening:
counts changed and scooters moved between polls, every feed was under fifteen
minutes old, and every feed URL is https, on the discovery's origin and under
its directory. No account credentials or private rider APIs are used.

| Country | Operator | Enabled feeds | Coverage | Available scooters |
| --- | --- | ---: | --- | ---: |
| Belgium | Bolt | 1 | Bruxelles | 2,750 |
| Belgium | Dott | 2 | Bruxelles, Charleroi | 3,750 |
| Belgium | Voi | 1 | Antwerpen | 925 |
| Belgium | Hoppy | 1 | Kortrijk | 200 |
| Norway | Voi | 9 | Oslo, Bærum / Asker, Lillestrøm / Lørenskog, Trondheim, Stavanger / Sandnes, Kristiansand / Vennesla, Arendal, Moss, Fredrikstad / Sarpsborg | 13,850 |
| Norway | Ryde | 11 | Oslo, Trondheim, Stavanger, Tromsø, Sandefjord, Ålesund, Skien, Fredrikstad, Tønsberg, Porsgrunn, Sarpsborg | 12,800 |
| Norway | Bolt | 1 | Oslo | 4,930 |
| Norway | Dott | 2 | Trondheim, Stjørdal | 950 |
| United Kingdom | Beryl | 6 | Bournemouth / Christchurch / Poole, Brighton, Cornwall (Falmouth, Newquay, Penzance, Truro), Leeds, Norwich (with Wymondham), Plymouth | 2,200 |
| United Kingdom | Dott | 4 | Bath, Bristol (with Yate), Milton Keynes, Nottingham | 3,450 |
| United Kingdom | Bolt | 1 | Liverpool | 1,830 |

Belgium has 4 cities, Norway 21 and the United Kingdom 18, once multi-town
feeds are routed per town. The bounds, discovery URLs and aliases are in
[`belgian-scooter-feeds.json`](../data/belgian-scooter-feeds.json),
[`norwegian-scooter-feeds.json`](../data/norwegian-scooter-feeds.json) and
[`british-scooter-feeds.json`](../data/british-scooter-feeds.json).

## New providers

- **Hoppy** (`hoppy`, Kortrijk): GBFS 3.0 on `hoppy.rideatom.com`. Its rental
  links are per-scooter `ride-hoppy.app.link` links. Its colour is a deeper shade
  of its brand teal, dark enough for white initials. Its system IDs start like
  Hopp's, so system IDs now match the longest provider prefix first.
- **Ryde** (`ryde`, Norway): through Entur. Its rental links carry the
  scooter's IMEI, which stays the same while the vehicle ID rotates, so the app
  drops their query. Without it the page still sends the rider to the app.
- **Beryl** (`beryl`, United Kingdom): GBFS 2.2 on
  `beryl-gbfs-production.web.app`. The `gbfs.beryl.cc` discovery files that the
  registry lists point to the production host, which breaks the same-origin
  rule, so the catalog uses the production URLs.

## Data handling

- **Entur** answers only clients that identify themselves. Every request to
  `api.entur.io` sends `ET-Client-Name: scootradar-map`, in the
  `<company>-<application>` form that Entur documents. With it the limit is
  20,000 requests a minute; without it, 30.
- **Norway's Dott** comes through Entur rather than Dott's own feeds, which carry
  the same fleet. Entur's terms give a clear licence, and Dott has closed its
  public GBFS elsewhere. The cost is two to five minutes of extra delay.
  `check:europe` skips the Dott listing for Norway, because Entur's manifest is
  the source there.
- **Beryl** regenerates its feeds every eight to ten minutes, despite a
  declared ttl of 120 s. It was 5–12 minutes old on every read, which leaves
  about three minutes before the fifteen-minute cut-off. Its vehicles carry
  range but no battery level, rental link or pricing plan.
- **Prices** are not shown for Ryde, Dott Norway, Dott UK or Beryl. The first
  three start their per-minute band at minute 1, which the price parser
  rejects. Beryl links no plan to its vehicles. Bolt, Voi and Hoppy prices
  show.
- **Oslo's night ban** (23:00–05:00): Voi empties its Oslo feed, but Bolt and
  Ryde keep publishing their scooters as available. The map shows what the
  feeds say.
- **Beryl's night pause:** after midnight, Beryl's Bournemouth / Christchurch /
  Poole and Brighton feeds list bikes only. Its other schemes keep their
  scooters.
- **Bounds** enclose the scooters' positions over several polls, without strays
  far from the median, plus padding. In Norway they are also cut at municipal
  lines. Geofencing cannot set them there, because Ryde's zones include a
  world polygon.

## Licences

- **Entur:** [NLOD 2.0](https://data.norge.no/nlod/en/2.0). Entur's
  [terms](https://developer.entur.no/terms-of-service) apply it to all API
  responses and require attribution: *Contains data under the Norwegian licence
  for Open Government data (NLOD) distributed by Entur AS*. The credits list
  names Entur and links the licence.
- **Beryl:** [CDLA-Permissive-2.0](https://cdla.dev/permissive-2-0/), named in
  its `system_information`. The data may be shared with the licence text, and
  computed results carry no obligation. The credits link the licence.
- **Bolt:** its [GBFS licence](https://bolt.eu/en/legal/micromobility/security-gbfs-license/)
  allows displaying the vehicles. It forbids data older than fifteen minutes
  and use of Bolt's trademarks without written permission.
- **Dott** publishes no `license_url` in Belgium or the UK. Its
  [API licence](https://ridedott.com/api-licence/) raises the same open
  question as in France, Germany and Italy.
- **Voi** (Antwerpen) and **Hoppy** publish no licence in their feeds.

## Known gaps

- **Belgium:**
  - Pony (Brussels, Liège, Charleroi) answers 400 to the key in the registry.
  - Lime Brussels and Kortrijk, Dott Ghent and Mons, and Bolt Ghent publish
    e-bikes only.
  - Lime Antwerp answers 404.
  - Bird Antwerp has been empty for years.
  - Dott Liège answers 403, and Dott Kortrijk 404.
  - Hoppy has only one public system out of the ids scanned. Its other
    cities answer 401.
- **Norway:**
  - Bergen (Ryde, Lime, RideMovi), Drammen, Larvik and Bodø have no public
    data, nor do Ryde's fleets around Oslo and in Kristiansand.
  - Dott Malvik, Melhus and Skaun hold fewer than twenty scooters each.
  - Seven Bolt systems in Entur are empty.
  - Lime Oslo is live but empty, and Zeus Oslo has been dead since 2021.
- **United Kingdom:**
  - Voi runs the most towns (London, Essex, Gloucestershire, Oxford,
    Northamptonshire, Slough, Solent) but has no public feed. Access is asked
    from nap@voiapp.io.
  - Lime (London, West Midlands, Salford, Milton Keynes) publishes no UK feed.
  - Zeus's UK feeds hold disabled scooters from 2023.
  - Several Beryl schemes have bikes only or are empty, and Dott Brunel
    University and Colchester have bikes only.
  - There are no trials in Scotland, Wales or Northern Ireland.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=BE,NO,GB --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
