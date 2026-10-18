# Swedish scooter feeds

Verified 13 October 2026. The audit started from the
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
and Dott's Swedish listing, then probed the URL patterns of Lime, Hopp and Bolt
for Swedish towns. Each enabled feed was polled six times, five minutes apart,
from 02:12 to 02:37 Stockholm time on a Tuesday night: positions changed between
polls, Lime's feed was under a minute old, and every feed URL is https, on the
discovery's origin and under its directory. No account credentials or private
rider APIs are used.

| Operator | Town | Available scooters |
| --- | --- | ---: |
| Lime | Uppsala | 814 |
| Hopp | Kiruna | 78 |

The bounds, discovery URLs and aliases are in
[`swedish-scooter-feeds.json`](../data/swedish-scooter-feeds.json). Lime
Uppsala is in the registry. Hopp Kiruna is not; it answers at the address Hopp
uses for its other towns.

## Data handling

- **Bounds:** Hopp publishes Kiruna's operating area in its geofencing feed,
  with a stop at the airport. The bounds are that area plus 0.005° of latitude
  and 0.01° of longitude, about 500 m at that latitude. Lime publishes no zones
  for Uppsala, so its bounds enclose where its scooters stood over the six
  polls, with the same padding. No scooter stood more than 5 km from the
  median, so none was left out.
- **Freshness:** Lime's feed was under a minute old at every poll, and 50 to
  60 of its positions changed from one poll to the next. Hopp stamps each
  response with the time it was asked for, so the fifteen-minute age limit
  can't tell how old its positions are. Over the night polls Hopp Kiruna moved
  one to five scooters at a time, by under 20 m, and kept 78 available, so
  its liveness rests on small moves; a daytime recheck would settle it.
- **Vehicle types:** Lime declares two scooter types and two bike types for
  Uppsala, but lists scooters only. The app keeps electric scooters only.
- **Prices** show for Hopp only: SEK 10 to start and SEK 3 a minute, from its
  pricing feed. Lime publishes no pricing feed.
- **Battery:** Hopp's comes from its `hopp_battery_level` field. Lime gives
  range only, as elsewhere, so Lime scooters show no battery level.
- **Rental links:** Hopp links each scooter; Lime falls back to its app.
- **IDs:** Lime renewed all its vehicle ids twice in the six polls and kept
  them otherwise. Hopp keeps its ids.
- **Time zone:** Hopp Kiruna's `system_information` gives its time zone as
  `Europe/Sweden`, which is not a time zone (Sweden's is `Europe/Stockholm`).
  Neither the app nor the scooter cache reads `system_information`, and night
  bans take their zone from [`rental-curfews.json`](../data/rental-curfews.json),
  so the error changes nothing on the map.

## Night bans

No covered Swedish town bans renting at night, so
[`rental-curfews.json`](../data/rental-curfews.json) has no Swedish entry.

- **Uppsala** slows scooters at night instead. Its permit conditions, adopted
  by the gatu- och samhällsmiljönämnden on 22 April 2026
  ([minutes](https://www.uppsala.se/contentassets/673a65bc3b0e4b3480d5ea37e75060c9/protokoll-gatu--och-samhallsmiljonamnden-2026-04-22---uppsala.se.pdf),
  § 35), cap the city at 4,500 scooters, and from 23:00 to 05:00 limit them
  to 15 km/h and ask for a reaction test to start a ride in the central area
  ([city page](https://www.uppsala.se/gator-trafik-och-resor/trafiksakerhet-och-regler/trafiksakerhet-for-dig-som-cyklar/elsparkcyklar)).
  The [proposal](https://www.uppsala.se/contentassets/b61c2f7c8377425da0a81693e1e5749a/5.-nya-villkor-vid-markupplatelse-for-elsparkcyklar.pdf)
  of 31 March 2026 had 10 km/h and a cap of 2,500. The minutes give no start
  date; the local press gives 1 July 2026. A speed limit is not a ban, so the
  map shows the scooters as at any other hour.
- **Kiruna** publishes no conditions for renting scooters, and its land-use
  guidelines of 16 February 2026 don't mention them. Hopp runs there only
  while the ground is bare of snow
  ([Kiruna Lapland](https://kirunalapland.se/planera-din-resa/res-inom-kiruna/till-fots-tva-hjul/)), so its
  feed may empty over the winter.
- **Stockholm** allows up to 12,000 scooters and has no night rule
  ([Stockholms stad](https://trafik.stockholm/trafikregler/elsparkcyklar/),
  updated 28 May 2026). None of them is on the map.
- No other Swedish town checked (Göteborg, Malmö) bans renting at night.

## Licences

- **Lime:** its feed's `license_url` leads to its
  [GBFS terms](https://www.li.me/legal/public-gbfs-terms), which allow internal
  use, and public display only where local law requires Lime to grant it, with
  data no older than ten minutes. Uppsala's conditions (clause 2.5) make
  operators share their data with the municipality's own system, in MDS and
  GBFS, not publish it, so no Swedish rule was found that requires the
  display. This is the same open
  question as for Lime in France, Germany and Portugal (see the
  [Portuguese, Spanish and Icelandic audit](portuguese-spanish-icelandic-scooter-feeds.md#licences)).
- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in Germany, Spain and Iceland.
- The credits' GBFS line names Sweden; no new source or licence needs a credit
  of its own.

## Known gaps

- **Stockholm** has no scooter on the map. The city allows up to 12,000
  shared scooters, and its traffic committee cut the operators to two from
  1 July 2026 (11 December 2025, § 31): Voi and Bolt, which
  [has up to 6,000](https://bolt.eu/sv-se/blog/elsparkcykel-tillstand-stockholm/).
  Neither publishes a feed: Bolt's only public
  feeds in Europe are Brussels and Liverpool, and its others answer 401.
  Lime's Stockholm feed answers 404.
- **Uppsala** has Voi and Ryde besides Lime, and neither publishes a feed,
  so the map shows Lime's part of the up to 4,500 scooters only.
- **Voi** (Göteborg, Malmö and other towns), **Ryde** and **Dott**
  (Göteborg) publish no public feed either.
- **Dott:** all 12 Swedish regions in the registry (Eskilstuna, Göteborg,
  Helsingborg, Höganäs, Jönköping, Lidköping, Partille, Skövde, Trollhättan,
  Varberg, Värnamo, Växjö) answer 404 `ERR_REGION_NOT_FOUND`, and Dott's
  Swedish listing names no region.
- **Lime** Göteborg and Malmö answer 404, as do the other Swedish towns
  guessed.
- **Zeus** Borlänge (35 scooters), Falun (13), Halmstad (14), Karlstad (1) and
  Gävle (0) list only disabled scooters, last reported in 2022 and 2023.
- **Hopp** answers 404 for every other Swedish town tried, Gällivare and Visby
  among them.
- **Qick** (Örebro, Linköping, Norrköping, Västerås) runs on ATOM Mobility,
  but its systems 5, 10, 53 and 104 answer "GBFS disabled" (18 October 2026).
- **Public data:** Sweden's national access point,
  [trafficdata.se](https://trafficdata.se), lists no shared-mobility
  dataset. Stockholm's [open data](https://openstreetgs.stockholm.se/Home/Data)
  has scooter parking bays only, behind an API key.
- Donkey Republic (Ängelholm, Båstad, Malmö, Ystad), Styr & Ställ and
  Gothenburg Cargo (Göteborg) and Lundahoj (Lund) are bikes only.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=SE --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
