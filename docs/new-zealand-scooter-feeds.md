# New Zealand scooter feeds

Verified 16 October 2026, New Zealand time. New Zealand's feeds are
Flamingo's (`data.rideflamingo.com`, GBFS 3.0) and JOLT's
(`prod-api.joltscooters.co.nz`, GBFS 2.3): 10 feeds in 11 towns, from
Auckland to Dunedin. All ten are in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv).
Every feed was polled every five minutes from 19:33 to 21:53 on Thursday 15
October and from 08:00 to 09:50 on Friday 16 October, New Zealand time, then
again from 09:59 to 10:58 on the Friday, just before the commit: 63 polls of
each. Every feed URL is https, on the discovery's origin and under its
directory. No account credentials or private rider APIs are used. The catalog
is [`new-zealand-scooter-feeds.json`](../data/new-zealand-scooter-feeds.json);
what is left out, and when to look again, is in
[Coverage gaps](coverage-gaps.md#no-public-data-in-covered-countries).

| Operator | Feed | Town | Available scooters, median poll (lowest–highest) | Rides seen |
| --- | --- | --- | ---: | ---: |
| Flamingo | `auckland` | Auckland | 1,310 (1,274–1,346) | 744 |
| Flamingo | `christchurch` | Christchurch | 1,154 (1,134–1,173) | 258 |
| Flamingo | `wellington` | Wellington | 451 (430–469) | 207 |
| Flamingo | `dunedin` | Dunedin | 374 (362–388) | 138 |
| Flamingo | `tauranga` | Tauranga | 316 (308–326) | 101 |
| Flamingo | `palmerston-north` | Palmerston North | 247 (237–258) | 81 |
| Flamingo | `porirua` | Porirua | 52 (48–53) | 12 |
| Flamingo | `porirua` | Wellington (Tawa) | 9 (7–10) | 5 |
| Flamingo | `waimakariri` | Rangiora | 51 (45–54) | 9 |
| Flamingo | `waimakariri` | Kaiapoi | 27 (25–28) | 6 |
| JOLT | `new_plymouth` | New Plymouth | 28 (26–29) | 2 |
| JOLT | `selwyn` | Rolleston | 18 (17–18) | 4 |

The counts are as the map counts them (see [Towns](#towns-and-their-outlines)),
without Wellington's e-bikes.

## Rides

Flamingo gives a scooter a new id after each trip, and lists only available
scooters; JOLT keeps a parked scooter's id and gives it a new one after a
trip. So rides were counted by place and range, from one poll to the next:

- a new id more than 300 m from every scooter that left the feed in the last
  half hour is a ride that ended there;
- a new id within 300 m of one that left, with at least 1.5 km less range, is
  a loop that came back near its start;
- a scooter that kept its id and moved more than 150 m was ridden.

Not counted: a new id near one that left with about the same range (an id
renewed without a trip, or a short one), three or more new ids within 30 m
of each other (staff putting scooters out), and a new id with about the
feed's full range (a charged scooter put out). Polls more than 25 minutes
apart start the count afresh.

Every town had rides by that count. The smallest have few: New Plymouth 2,
Rolleston 4, Tawa 5, Kaiapoi 6 and Rangiora 9, where staff also put out 10. Each has about 10 or more available scooters and
riders on them, so all stay. What fell short is in [Known gaps](#known-gaps).

## Towns and their outlines

Flamingo's `porirua` feed covers Porirua and Tawa: "Explore Porirua City
(and Tawa)", says its [Porirua page](https://flamingoscooters.com/city/porirua).
Tawa is a suburb of Wellington City, so a rider
there should see Wellington, not Porirua. The `porirua` system has two areas,
Porirua and Wellington, and Wellington City's and Porirua City's council
boundaries are in [`town-outlines.json`](../data/town-outlines.json):
OpenStreetMap's (relations 4266321 and 4266370), simplified to within 20 m.
A `porirua` scooter inside Wellington City counts under Wellington, beside
the `wellington` feed's, and one inside Porirua City under Porirua.
`waimakariri` covers Rangiora and Kaiapoi, each with its own area, and Woodend
and Pegasus, which are left out (see [Known gaps](#known-gaps)).

Christchurch, Kaiapoi, Rangiora and Rolleston need no outline: their boxes
don't touch. OpenStreetMap has no boundary for Rangiora, Kaiapoi or Rolleston
anyway, only for their districts, Waimakariri and Selwyn, whose outlines
would take in farmland and the small towns left out.

Replayed over every poll, against the council and district boundaries
(Woodend–Pegasus told from Rangiora and Kaiapoi, and Lincoln from Rolleston,
by where they stand in their district):

- **Misnamed:** none.
- **Dropped:** of the covered towns' scooters, none. The scooters of the
  towns left out are dropped by design: Flamingo's in Woodend and Pegasus,
  about 5 a poll, and JOLT's in Lincoln, about 9.
- **Outside every town:** one `wellington` scooter, on a wharf in Evans Bay,
  stood just outside Wellington City's land boundary, and counts under
  Wellington, whose box holds it.

**Bounds.** Neither operator publishes a service area, only zones where
riding or parking is limited, and none of those zones has a time. So each
town's bounds are the scooters' extent in the survey's polls, from the 1st to
the 99th percentile, joined with its zones' extent, plus about 1 km on every
side. Two were changed by hand: Tauranga's south edge goes to 37.7585° S, to
take in Tauranga Crossing, where scooters stand; and Kaiapoi's leaves out the
zones Flamingo draws along the corridor to Woodend and Pegasus. Rolleston's
box ends at 172.4189° E, west of Lincoln and Prebbleton.

**City names.** New Zealand's regions are in the catalog (Auckland,
Canterbury, Wellington, Otago, Manawatū-Whanganui, Bay of Plenty and
Taranaki), so search can tell a town by them, but a city's title is its name
alone, and the zoomed-out map gives a total for the country, not for each
region.

**Search** finds Auckland as Tāmaki Makaurau, Christchurch as Ōtautahi or
Otautahi, Wellington as Te Whanganui-a-Tara, Dunedin as Ōtepoti, New
Plymouth as Ngāmotu or Ngamotu, Tauranga as Mount Maunganui, Mt Maunganui or
Papamoa, and Palmerston North as Palmy, or with its region, written with or
without macrons ("Palmerston North, Manawatū-Whanganui"). New Zealand is
found as Aotearoa and NZ. A town written with or without its macrons is the
same town: Taupō and Taupo find the same thing (nothing; Beam's fleet there
has no public feed).

**The country's total**, zoomed out, stands near Nelson, at the
geographic centre of the country, between the fleets of the North Island and
the South Island.

## Data handling

- **Freshness.** Both operators build their status feed at the request
  (Flamingo's with a `ttl` of 60 seconds). Flamingo's scooters report their
  position about every five minutes and JOLT's every ten; one Flamingo
  scooter in Auckland had reported nothing for 16 hours.
- **Vehicle types.** Each Flamingo feed declares an electric scooter and an
  e-bike; only Wellington's lists e-bikes, 78 a poll, which the map leaves
  out. JOLT's declare one scooter type.
- **Prices.** Flamingo's plans are NZ$1 to unlock and NZ$0.45 a minute in
  Auckland, Christchurch and Dunedin, NZ$0.55 elsewhere; JOLT's NZ$1 and
  NZ$0.50 in New Plymouth, NZ$0.45 in Selwyn. New Zealand's prices include
  GST. Flamingo marks its plans `is_taxable`, but the map adds "+ tax" only
  in the United States and Canada, so the card reads "NZ$1.00 to unlock, then
  NZ$0.55 a minute" in an American English browser and "$1.00 to unlock, then
  $0.55 a minute" in a New Zealand one, with no tax added. JOLT's per-minute
  plans start the per-minute rate at minute 1, as Dott's do, and the card
  reads them the same way.
- **Battery and range.** Flamingo gives only each scooter's range, up to 22
  km; its cards show the range and no battery level, and a minimum battery
  set in the filters hides them, as it does any scooter without one. JOLT
  gives both.
- **Rental links.** Flamingo links each scooter on
  `ride.flamingoscooters.com`, with one link for iPhones (`/vehicle/<id>`)
  and another for Android (`/v/<id>`), and none for the web, so phones open
  their own and a desktop browser none. JOLT links each scooter on
  `joltscooters.co.nz/vehicle/<uuid>`, the same link for both phones; JOLT's
  apps claim every path of that host (its `apple-app-site-association` and
  `assetlinks.json`), so the link opens the app where it is installed. The
  `joltscooters://` in JOLT's `system_information` is its apps'
  `discovery_uri`, which the map never reads, and no scooter's link uses it
  (55 of 55 on 16 October 2026), so the link rules leave it out. The web
  and the iPhone app open only links on each operator's own host.
- **Time zones.** The app never reads a feed's `timezone`. Flamingo's says
  `Etc/UTC`; every area of the catalog says `Pacific/Auckland`, as JOLT's
  feeds do.
- **Hours.** JOLT's `new_plymouth` feed gives rental hours of 05:00 to 23:30;
  the other feeds, all day. The map doesn't read them.

## Rules

- **Who may ride.** No law requires a helmet on an e-scooter in New Zealand,
  and they may be ridden on the footpath, as Auckland Council's
  [e-scooter page](https://www.aucklandcouncil.govt.nz/en/licences-regulations/e-scooter-licences-regulations-auckland.html)
  says. Flamingo rents only to riders of 18 or more, on its
  [city pages](https://flamingoscooters.com/city/waimakariri).
- **Night bans: none town-wide,** so
  [`rental-curfews.json`](../data/rental-curfews.json) has no New Zealand
  entry. Three towns ban hiring in some streets on some nights:
  - **Wellington:** the city's
    [code of practice for share schemes](https://wellington.govt.nz/-/media/parking-roads-and-transport/parking-and-roads/smart-transport/files/micromobility-share-scheme-code-of-practice.pdf)
    (v9.0, 25 September 2025), §7.4, bans hiring in the Courtenay precinct
    from 21:00 to 06:00 on Thursday, Friday and Saturday nights and on the
    eves of public holidays. The precinct is drawn only as a map, in its
    Appendix 2. The code also bans riding and parking on the footpaths of
    Courtenay Place, Willis Street and Manners Street, where riding on the
    road is allowed.
  - **Auckland:** the council's
    [Rental Micromobility Code of Practice](https://www.aucklandcouncil.govt.nz/content/dam/ac/docs/licence-and-compliance/rental-micromobility-code-of-practice.pdf)
    (v5.0), clause j, says only that the council may impose a curfew in
    certain places, where devices are locked or removed before a set time;
    it names no place or hour. Flamingo's
    [Auckland page](https://flamingoscooters.com/city/auckland) says its
    curfew areas are closed from 22:00 on Friday and Saturday, and Wynyard
    Quarter from 22:00 every day.
  - **Tauranga:** only Flamingo's
    [Tauranga page](https://flamingoscooters.com/city/tauranga), which says
    its curfew areas are closed from 22:00 on Friday and Saturday. No council
    source was found.

  `rental-curfews.json` can hold a ban on some weekdays in a polygon, but
  its polygons are fetched from official boundary sources by id, and none of
  these zones has one: Wellington's precinct is a picture, and Auckland's
  and Tauranga's are named only by the operator, without a map. Nor can it
  say "the eve of a public holiday". So the map shows none of them, and
  says nothing of them, rather than mark a whole town as closed at night.
  Flamingo's feeds list Courtenay Place and Wynyard Quarter only as zones
  where a ride may not end, at every hour.
- **No riding on High Street in Rangiora,** between Durham Street and
  Ashley and Ivory Streets: Flamingo's scooters stop there by themselves,
  its [Waimakariri page](https://flamingoscooters.com/city/waimakariri) says,
  and its feed draws the street as a zone where no one may ride.
- **Auckland's licences** for Flamingo and Lime expire in November 2026, and
  the council says it holds no new round; the operators may apply again (its
  [e-scooter page](https://www.aucklandcouncil.govt.nz/en/licences-regulations/e-scooter-licences-regulations-auckland.html)).
  Lime publishes no feed there.

## Parking

Flamingo lists virtual stations in every town (131 in Auckland, 61 in
Wellington), its "preferred parking" spots, where a ride earns credit. Its
[Auckland page](https://flamingoscooters.com/city/auckland) says that on
Queen Street scooters may be parked only in the marked bays; 28 of its
stations are on Queen Street. Its feed doesn't say so: its Queen St zone lets
a ride end anywhere and flags no bay. So from zoom 16 the map shows all of
Flamingo's stations as parking spots, none of them required, and Queen
Street's rule is left to Flamingo's app. JOLT lists stations too (72 in New
Plymouth, 19 in Selwyn), with no bay zone, and the map shows them the same
way. Neither operator's zones are drawn on the map: in Auckland, 458 of
Flamingo's 511 forbid ending a ride, 156 of them riding too, mostly parks,
schools and motorways.

## Licences

- **Flamingo:** its feeds give `license_id` CC-BY-4.0, with no link and no
  attribution text. The map's credits name "NZ: Flamingo · CC BY 4.0".
- **JOLT:** no `license_id` or `license_url`; it publishes no licence.
- **OpenStreetMap:** the two town outlines are © OpenStreetMap contributors,
  under the [ODbL](https://opendatacommons.org/licenses/odbl/), and the
  credits link it on the line New Zealand shares with the other countries
  whose outlines come from OpenStreetMap ("CH/FR/PT/ES/PL/UA/IL/NZ:
  OpenStreetMap boundaries · ODbL").
- The map's credits name both operators on a GBFS line of their own, "NZ:
  Flamingo, JOLT".

## Known gaps

- **Left out:**
  - JOLT's `hutt_valley` feed, with 30 scooters in Lower Hutt and 14 in Upper
    Hutt in the median poll, none of which was ridden, by the count above,
    in any poll, Friday's morning commute included. On Sunday 18 October
    2026, from 14:28 to 15:18, it held no scooter at all. Recheck on 1
    December.
  - JOLT's `napier` feed, which has 53 zones and no scooter. Not in the
    registry. Recheck on 1 December 2026.
  - Lincoln, in JOLT's `selwyn` feed: about 9 scooters a poll, none ridden.
    Recheck on 1 December 2026.
  - Woodend and Pegasus, in Flamingo's `waimakariri` feed: about 5 scooters,
    none ridden.
- **No public feed:** Beam, in Queenstown, Taupō and Whangārei, whose feed
  host answers 401; Lime, in Auckland and elsewhere. Neuron has left New
  Zealand.
- **Zone curfews** in Wellington, Auckland and Tauranga are not on the map
  (see [Rules](#rules)).

## Recheck

```bash
node scripts/check-french-feeds.mjs --countries=NZ
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone. A new town in
the Wellington region whose feed reaches across a council boundary needs its
outline in `data/town-outlines.json`; run
`node scripts/update-town-outlines.mjs`, then `npm run generate:providers`.
