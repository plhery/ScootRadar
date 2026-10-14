# American scooter feeds

Verified 14 October 2026. The United States' feeds come from
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
and from the addresses the operators use for their other towns: Bird
(`mds.bird.co`), Lime (`data.lime.bike`), Spin, Veo
(`cluster-prod.veoride.com`), Lyft (`gbfs.lyft.com`) and Bolt
(`mds.bolt.eu`). 215 systems were surveyed. Every feed URL is https, on the
discovery's origin and under its directory. No account credentials or private
rider APIs are used. The catalog is
[`american-scooter-feeds.json`](../data/american-scooter-feeds.json); what is
left out, and when to look again, is in [Coverage gaps](coverage-gaps.md).

Each town is named with its state, "Washington, DC", as the United States has
many towns of one name. Zoomed out, the map shows a total per state, at the
state's centre of population (US Census Bureau, 2020).

## Washington, DC

| Operator | Feed | Available scooters in Washington | Polled |
| --- | --- | ---: | --- |
| Hopp (Bolt) | `mds.bolt.eu/gbfs/3/23` | 1,366 to 1,379 | 16:34 to 16:54 EDT, 14 October |
| Veo | `veoride.com/…/xdc` | 265 to 269 | 16:34 to 16:54 EDT, 14 October |

Both were also polled six times from 11:27 to 12:09 and three times from 16:13
to 16:23 that day, in the survey. Between 16:34 and 16:54, 195 Hopp scooters
left the feed and 190 came back under new ids: Bolt gives a scooter a new id
after each ride. Veo keeps its ids, and 56 of its scooters moved more than
300 m between two polls, up to 1.8 km.

**Hopp is Bolt.** In Washington, Bolt rents its scooters under the name Hopp:
its feed's links open `bolt-hopp://`, the app `ee.hopp.client`, and its site,
gethopp.com, is "© 2026 Hopp by Bolt Services US Inc". Riders see Hopp on the
scooters and in the app they open, so the map names them Hopp, in Hopp's
green, as their own provider, `bolt_hopp`. It is not the Icelandic Hopp the
map shows in Europe, a different company whose links (`app.hopp.bike`) open
another app; neither takes the other's links, nor Bolt's European app
(`bolt://`). The two never share a town, and the provider filter lists only
the providers in view, so the map never offers two "Hopp" side by side. The
feed's system id, "BoltEU_Washington DC", has a space; the app reads its
own ids, `bolt_hopp_us_washington`, never the feed's.

Hopp's feed gives every scooter one of two plans, both $1 to unlock and $0.16
a minute, untaxed ("Unlock 1.00 USD, 0.16 USD/MIN."). That is the price the
map shows; riders in the app may see a city or promotional price.

**Bounds.** Bolt publishes its zones: the "Main allowed area", 164.6 km², is
the District. Washington's bounds are that area's box, 38.795° N to
38.996° N and 77.119° W to 76.909° W, plus about 1 km, and they hold Veo's
scooters too. Left out, in the last poll:

- Hopp: one scooter, disabled, at 38.881° N 76.860° W in Landover, Maryland,
  4 km east of the District, which the map would not show anyway.
- Veo: one at 39.030° N 77.105° W, in North Bethesda, Maryland, which moved
  less than a metre in 20 minutes. One at 22.79° N 113.93° E, in Shenzhen,
  where Veo's test system (`xds`) has its scooters.

Veo's feed also has 7 to 9 scooters in Virginia, inside Washington's box and
counted with it: 7 stand within 30 m of one another at 38.808° N 77.097° W, by
Eisenhower Avenue in Alexandria, as at a depot. Too few, and too still, for an
Alexandria area of their own. Veo's `arl` feed is the same fleet as `xdc`, so
it is left out.

Search finds the city as Washington, Washington DC, Washington, D.C., DC, D.C.
and District of Columbia.

## Reading the feeds

- **Time zones.** The app never reads a feed's `timezone`. Bird's and Spin's
  are mostly older names (`US/Eastern`, `US/Central`, `US/Arizona`, and
  `Canada/Eastern` in Canada), and Veo gives `America/Chicago` for every town,
  Washington's included. Each service area in
  the catalog says its own, `"timeZone": "America/New_York"`, by its name today;
  the generator refuses an older name, a zone of another country, a seasonal
  pause in another zone than its town's, and a night ban in
  `data/rental-curfews.json` in another zone than the towns around it.
- **Hopp (Bolt):** GBFS 3.0, whose `last_updated` is a time
  ("2026-10-14T20:32:38Z") rather than a number of seconds. Its vehicles have
  no `last_reported`, so a scooter's age is the feed's. The feed lists Bolt's
  bicycles beside its scooters; only `scooter_standing` types with electric
  propulsion are shown.
- **Veo:** GBFS 2.2, `form_factor` "scooter". Beside its 300 scooters, the
  Washington feed lists 4,294 vehicles typed as electric bicycles (`bicycle`,
  `electric`), the seated Cosmo among them, which are not shown. No
  `last_reported`, no charge, only `current_range_meters`. Its prices are
  taxable, shown with "+ tax". Each scooter's link opens Veo's app on it
  through Adjust (`gmjc.adj.st`, with the scooter's number).
- **Lyft** writes `is_reserved` and `is_disabled` as 0 and 1, its prices as
  strings ("1.00"), and links no plan from its vehicles or their types. Its
  plan for scooters is `SCOOTER_SINGLE_RIDE`, used where the feed lists it and
  has one scooter type naming no plan. Its link is one per city, which opens
  the app's code scanner (`chi.lft.to/lastmile_qr_scan`). No `last_reported`.
- **Bird and Spin** give `bird://charger-onboarding`, the sign-up for chargers,
  as their Android app's address in `system_information` (85 Bird and 50 Spin
  feeds). The map never opens it, in any country.
- **Bird, Spin and Lime** give a scooter a new id after each ride, so rides
  show as a scooter leaving and another coming back elsewhere.
- **Size.** Veo's Washington status file is about 1.6 MB, with its bicycles. The
  scooter cache sizes itself by the number of feeds; its memory and
  `scootradar_upstream_cache_evictions_total` are watched as feeds are added.

## Recheck

```bash
node scripts/check-french-feeds.mjs --countries=US
```
