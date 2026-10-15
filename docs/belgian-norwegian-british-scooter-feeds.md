# Belgian, Norwegian and British scooter feeds

Verified 11 October 2026. The audit started from the
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
Dott's country listings, [Entur's Mobility API](https://developer.entur.no/docs/open-services/mobility)
for Norway and Beryl's own index of schemes, then probed the URL patterns of the
other operators. Each enabled feed was polled several times over an evening:
counts changed and scooters moved between polls, every feed was under fifteen
minutes old, and every feed URL is https, on the discovery's origin and under
its directory. No account credentials or private rider APIs are used.

Hoppy's scooters in Ostend, Mechelen, Sint-Niklaas and Blankenberge were added
on 14 October 2026; see
[Hoppy's Flemish towns, October 2026](#hoppys-flemish-towns-october-2026).

| Country | Operator | Enabled feeds | Coverage | Available scooters |
| --- | --- | ---: | --- | ---: |
| Belgium | Bolt | 1 | Bruxelles | 2,750 |
| Belgium | Dott | 2 | Bruxelles, Charleroi | 3,750 |
| Belgium | Pony | 1 | Charleroi | 220 |
| Belgium | Voi | 1 | Antwerpen | 925 |
| Belgium | Hoppy | 5 | Blankenberge, Kortrijk, Mechelen, Oostende (with Bredene), Sint-Niklaas | 1,225 |
| Norway | Voi | 9 | Oslo, Bærum / Asker, Lillestrøm / Lørenskog, Trondheim, Stavanger / Sandnes, Kristiansand / Vennesla, Arendal, Moss, Fredrikstad / Sarpsborg | 13,850 |
| Norway | Ryde | 11 | Oslo, Trondheim, Stavanger, Tromsø, Sandefjord, Ålesund, Skien, Fredrikstad, Tønsberg, Porsgrunn, Sarpsborg | 12,800 |
| Norway | Bolt | 1 | Oslo | 4,930 |
| Norway | Dott | 2 | Trondheim, Stjørdal | 950 |
| United Kingdom | Beryl | 6 | Bournemouth / Christchurch / Poole, Brighton, Cornwall (Falmouth, Newquay, Penzance, Truro), Leeds, Norwich (with Wymondham), Plymouth | 2,200 |
| United Kingdom | Dott | 4 | Bath, Bristol (with Yate), Milton Keynes, Nottingham | 3,450 |
| United Kingdom | Bolt | 1 | Liverpool | 1,830 |

Belgium has 8 cities, Norway 21 and the United Kingdom 18, once multi-town
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

## Hoppy's Flemish towns, October 2026

Hoppy runs all four on ATOM Mobility, as in Kortrijk:
`https://hoppy.rideatom.com/gbfs/<id>/v3.0/gbfs`, with 1996 for Oostende, 1490
for Mechelen, 1734 for Sint-Niklaas and 1494 for Blankenberge. All are keyless
GBFS 3.0, and every feed URL is https, on the discovery's origin and under its
directory.

- **Liveness:** ATOM stamps `last_updated` with the time of the request and
  gives no `last_reported`, and a scooter's `vehicle_id` changes after each
  ride. So each scooter was followed by the code at the end of its rental link,
  the number printed on it. Each feed was polled every five minutes from
  about midnight on Tuesday 13 October to 10:29 the next morning, 142 to 153
  times. Oostende had 84 rides, Mechelen 119, Sint-Niklaas 47 and
  Blankenberge 8, from midnight through the morning: each scooter came back
  0.2 to 4.7 km away under a new id, with 0.6 to 15 km less range. Oostende
  listed 527 to 537 available scooters, Mechelen 177 to 199, Sint-Niklaas 174
  to 181 and Blankenberge 111 to 120.
- **Scooters:** every vehicle type is `scooter_standing`, `electric`, with a
  60 km maximum range. Hoppy's other Flemish systems carry e-bikes only (see
  [Known gaps](#known-gaps)).
- **Oostende** is one area. Its scooters stand in Ostend and in Bredene, which
  touches it to the east, so Bredene is an alias. One scooter stood in
  Blankenberge, about 17 km up the coast and far from any of Oostende's parking
  zones. Blankenberge has its own feed, so the bounds leave that scooter out:
  Oostende's end at 2.9994° E and Blankenberge's start at 3.0977° E, and no
  scooter is counted twice.
  The city signed a five-year deal with Hoppy, capped at 750 scooters, with
  8 km/h zones and parking zones
  ([VRT, 17 December 2025](https://www.vrt.be/vrtnws/nl/2025/12/17/oostende-nieuwe-deelsteps-zones-sensoren/)).
- **Mechelen:** one scooter in its feed stood in Kortrijk, 60 km away, where
  Hoppy's Kortrijk feed already shows its own scooters. Mechelen's bounds leave
  it out. Hoppy had 200 scooters there in June 2025, which it was refitting
  with cameras that slow them to walking pace on pavements
  ([VRT, 4 June 2025](https://www.vrt.be/vrtnws/nl/2025/06/04/hoppy-deelsteps-mechelen-artificiele-intelligentie-scannen-wegde/)).
  Malines is an alias.
- **Sint-Niklaas** chose Hoppy when Bird's contract ended, with 300 scooters
  ([VRT, 14 June 2025](https://www.vrt.be/vrtnws/nl/2025/06/14/deelsteps-ai-sint-niklaas-artificiele-intelligentie/)).
- **Bounds:** ATOM's geofencing forbids starting or ending a ride everywhere
  (`global_rules`), and allows both in Hoppy's parking zones: 167 in Oostende,
  131 in Mechelen, 190 in Sint-Niklaas and 48 in Blankenberge. Each feed also
  has one large no-ride polygon without a hole over the whole town, which is
  how ATOM exports the operating area, so it can't serve as bounds. The bounds
  enclose the parking zones and the scooters seen, plus 0.005° of latitude and
  0.01° of longitude.
- **Prices:** EUR 1.00 to start (EUR 0.95 in Sint-Niklaas), then EUR 0.18 to
  0.33 a minute, by the scooter's tier.
- **Battery:** Hoppy publishes range only, so the map shows range and no
  percentage, as in Kortrijk.
- **Night rules:** every feed gives opening hours of `24/7`, and no town's
  rules or reports name a night ban. Mechelen's regulation for shared scooters
  ([council, 16 December 2019](https://mechelen.be/reglement-deelstepspdf))
  sets permits and parking rules but no hours. No curfew was added.
- **Load:** the scooter cache asks for each feed's `vehicle_status` every 20
  minutes, or every minute for 10 minutes after someone looks at the town, and
  its metadata once an hour. So the four new Flemish feeds add about 32
  requests an hour to `hoppy.rideatom.com`, and at most about 65 each while
  watched; see
  [ATOM's request rate](german-italian-scooter-feeds.md#atoms-request-rate-october-2026).

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
- **Pony** publishes Charleroi and Liège on Belgium's national access point,
  [transportdata.be](https://transportdata.be/dataset/pony_charleroi), with
  the key each feed URL needs (added 12 October 2026). The key in MobilityData's
  registry answers 400. Pony's discovery file lists its feeds under
  `/v1/Charleroi/en/`, not the `/v1/charleroi/fr/` the access point names, so
  the catalog uses the address the file gives, to keep the same-directory
  rule. Most of its scooters stand in Pony's parking zones, as in France.
- **Beryl** regenerates its feeds every eight to ten minutes, despite a
  declared ttl of 120 s. It was 5–12 minutes old on every read, which leaves
  about three minutes before the fifteen-minute cut-off. Its vehicles carry
  range but no battery level, rental link or pricing plan.
- **Prices** show for every operator but Beryl, which links no plan to its
  vehicles. Ryde and Dott start their per-minute band at minute 1, while their
  descriptions charge every minute; the parser reads it that way, so a ride
  estimate is at most one minute's fee above the letter of the band.
- **Night bans:** most Norwegian towns ban renting at night (see
  [Night bans](#night-bans)). Voi empties its Oslo feed during the ban, but
  Bolt and Ryde keep publishing their scooters as available, so the map shows
  them and says why they can't be rented.
- **Beryl's night pause:** after midnight, Beryl's Bournemouth / Christchurch /
  Poole and Brighton feeds list bikes only. Its other schemes keep their
  scooters.
- **Bounds** enclose the scooters' positions over several polls, without strays
  far from the median, plus padding. In Norway they are also cut at municipal
  lines. Geofencing cannot set them there, because Ryde's zones include a
  world polygon. Voi's Stavanger / Sandnes feed crosses them: since 14 October
  2026 its Sandnes area reaches south to 58.765 N (from 58.8072), over Ganddal
  and Kvernaland, in Time, which are now its aliases, and its Stavanger area to
  58.868 N (from 58.8765), into Sola. 8 to 10 scooters stood there in each
  poll, at night and by day, inside Voi's zones, and the map left them out.
  Ryde's Skien zone reaches the centre of Porsgrunn, where about 90 of the
  Skien feed's scooters stand, so that feed has had a second area since the
  same day, Porsgrunn, with the bounds of Ryde's Porsgrunn feed; zoomed out,
  those scooters count under Porsgrunn.
- **Town outlines:** where the boxes of touching towns overlap, the nearest
  centre named the wrong town for about 220 Norwegian scooters a poll on the
  evening of 15 October 2026: Sandnes's at Forus under Stavanger (75 and 77,
  in two polls), Lillestrøm's under Lørenskog (55, 56) and Lørenskog's under
  Lillestrøm (24), Skien's under Porsgrunn (47, 45), and a few between Oslo,
  Bærum and Lørenskog. Oslo, Bærum, Lørenskog, Lillestrøm, Stavanger, Sandnes,
  Skien and Porsgrunn now have their kommune's outline in
  [`town-outlines.json`](../data/town-outlines.json), from Kartverket, as for
  the night bans, simplified to within 20 m; a scooter inside one counts
  under that town. After: 3 and 2 a poll, each within a few metres of a
  kommune line or in a town without an outline. Ryde's Stavanger feed reaches
  over the line into Sandnes at Forus, where 19 or 20 of its scooters stood in
  four polls from 22:44 to 23:25, one arriving between them; so the feed has had a
  second area since that evening, Sandnes (58.8788–58.896 N, 5.695–5.755 E),
  given Sandnes's centre, and those scooters count under Sandnes. Bolt's
  Oslo feed reaches Lørenskog and Bærum, where Bolt has no area: its 2
  scooters in Lørenskog and 1 in Bærum, which didn't move in ten minutes, are
  left out, as a feed keeps no scooter in a town where its operator runs no
  service.
- **Bournemouth, Christchurch and Poole:** Beryl's one feed has an area per
  town, and their boxes overlap: in a poll at 21:44 on 15 October 2026, 62 of
  its 658 scooters counted under the wrong one. Each town now has the outline
  of its district before the three merged in 2019, the ONS's December 2018
  boundaries, as for the night ban; after, 4, where OpenStreetMap's line
  between Poole and Bournemouth parts from the ONS's. A second poll, at 22:28,
  inside the night ban, found no Beryl scooters listed there.

## Night bans

Each Norwegian municipality sets its own hours in its *forskrift* on renting
small electric vehicles, and British trial areas set theirs in the trial's
conditions. Ten Norwegian towns and two British areas covered ban renting at
night. While a ban holds, the dock tells of it, with a moon, for the town in
view, and a scooter's card says when it can be rented again. Web and iOS read
the same [`rental-curfews.json`](../data/rental-curfews.json). It holds each
rule, its source and the town's boundary, simplified to within 100 m by
`scripts/update-curfew-areas.mjs`: Norwegian municipalities from Kartverket
(CC BY 4.0), British districts from the ONS (Open Government Licence v3.0). The
boundary matters: Oslo's feeds spill into Bærum and Lørenskog, where renting
stays open at night.

| Town | Nights | Source |
| --- | --- | --- |
| Oslo | Every night, 23:00–05:00 | [FOR-2024-11-20-2821](https://lovdata.no/dokument/LF/forskrift/2024-11-20-2821) § 12 |
| Trondheim | Friday and Saturday, 23:00–05:00 | [FOR-2022-02-08-192](https://lovdata.no/dokument/LF/forskrift/2022-02-08-192) § 7 f |
| Stavanger | Friday and Saturday, 00:00–05:00 | [FOR-2022-09-05-2643](https://lovdata.no/dokument/LF/forskrift/2022-09-05-2643) § 10 |
| Kristiansand | Friday and Saturday, 00:00–05:00 | [FOR-2024-01-24-148](https://lovdata.no/dokument/LF/forskrift/2024-01-24-148) § 6 c |
| Vennesla | Every night, 00:00–04:00 | [FOR-2025-02-06-166](https://lovdata.no/dokument/LF/forskrift/2025-02-06-166) § 6 c |
| Tromsø | Friday and Saturday, 23:00–06:00 | [FOR-2025-09-03-1800](https://lovdata.no/dokument/LF/forskrift/2025-09-03-1800) § 12 |
| Tønsberg | Friday and Saturday 23:00–05:00, other nights 01:00–05:00 | [FOR-2024-09-04-2115](https://lovdata.no/dokument/LF/forskrift/2024-09-04-2115) § 6 d |
| Sandefjord | Every night, 01:00–05:00 | [FOR-2022-06-22-1166](https://lovdata.no/dokument/LF/forskrift/2022-06-22-1166) § 7 e |
| Lillestrøm | Friday and Saturday, 00:00–05:00 | [FOR-2022-06-15-1545](https://lovdata.no/dokument/LF/forskrift/2022-06-15-1545) § 7 e |
| Arendal | Every night, 23:00–05:00 | [City page](https://www.arendal.kommune.no/tjenester/vei-parkering-og-havn/parkering/elsparkesykler/) |
| Bournemouth, Christchurch, Poole | Every night, 22:00–05:00 | [Beryl](https://help-bikes.beryl.cc/en/articles/16098480-when-are-beryl-e-scooters-available-to-hire) |
| Brighton and Hove | Every night, 00:00–05:00 | [Council](https://www.brighton-hove.gov.uk/travel-and-road-safety/travel-transport-and-road-safety/beryl-e-scooters-trial) |

- A night is named after its evening: Friday's runs into Saturday morning.
- **Trondheim's** rule bans every night, but lets the city trial weekday
  nights, and Voi and Ryde open them. Only Friday and Saturday are sure.
- **Arendal's** rule says 00:00–05:00, its city page 23:00–06:00 and Voi, the
  only operator, 23:00–05:00. The map keeps the hours two of them agree on.
- Stavanger, Tromsø and Tønsberg also close on the eve of public holidays,
  which the map leaves out.
- Oslo's city government can lift its ban without changing the rule. The city
  council kept it in January 2026
  ([NRK](https://www.nrk.no/stor-oslo/bystyret-stemte-ned-innstramminger-for-elsparkesykler-i-oslo-1.17746568)).
- Beryl drops its scooters from the BCP and Brighton feeds during the ban, so
  the moon explains an empty map there.
- Bergen, Drammen and Larvik in Norway, and Northampton in England, ban some
  nights too, but have no public feed.
- No other city checked in the covered countries bans renting at night,
  except on event nights: Munich's Oktoberfest, Cologne's carnival and
  Brussels on New Year's Eve.

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
- **Pony:** transportdata.be marks both of its datasets open, under "Other
  (Attribution)". The credits name Pony and the access point.
- **Voi** (Antwerpen) and **Hoppy** (Blankenberge, Kortrijk, Mechelen,
  Oostende, Sint-Niklaas) publish no licence in their feeds.

## Known gaps

- **Belgium:**
  - Brussels bans shared e-scooters from 1 January 2027, when Bolt's and
    Dott's permits end ([La Libre, 11 June 2026](https://www.lalibre.be/belgique/mobilite/2026/06/11/grand-changement-dans-le-secteur-de-la-mobilite-bruxelles-interdit-les-trottinettes-partagees-sur-son-territoire-IRS4BZDEPFFS3H6MJT23AUASK4/)).
    Their Brussels feeds should empty then.
  - Pony's Liège feed held 2 scooters on 12 October 2026, and 8 or 9
    available in six polls on 13 October, under ten, and most never moved,
    so it is left out; check it again in April 2027.
    Pony publishes no feed for Brussels; read with the key the French access
    point publishes for La Roche-sur-Yon, its Brussels region listed 4
    scooters, all disabled.
  - Lime Brussels and Kortrijk, Dott Ghent and Mons, and Bolt Ghent publish
    e-bikes only.
  - Lime Antwerp answers 404.
  - Bird Antwerp has been empty for years.
  - Dott Liège answers 403, and Dott Kortrijk 404.
  - Hoppy's Vervoerregio West-Vlaanderen (ATOM id 2010), Kempen (1973) and
    Dender & VVA (1663) systems list e-bikes only, about 430, 270 and 360 on
    13 October 2026, and West-Vlaanderen 76 pedal bikes too. Hoppy's Genk
    system (1522) held 6 e-bikes.
- **Norway:**
  - Bergen (Ryde, Lime and RideMovi, about 9,000 scooters), Drammen (Ryde,
    Gogo), Larvik and Bodø (Ryde) have scooters but no public source. Entur,
    Norway's only public aggregator, has none of them: its GraphQL API sees no
    scooter its manifest lacks, and guessed system ids answer 404. Ryde
    publishes only the 11 systems in the catalog, so its fleets in Bærum,
    Lillestrøm, Lørenskog and Kristiansand are missing too.
  - Dott Malvik, Melhus and Skaun hold fewer than twenty scooters each, and
    e-bikes, which the map leaves out. Malvik listed 15 to 17 available
    scooters in 27 polls on the evening of 13 October 2026 and 12 at midday
    on the 14th, but none was ridden: Dott deployed two, swapped a low one
    for a charged one and collected another, all without a ride. Check it on
    the afternoon of Saturday 17 October, matching scooters by position,
    since Entur renews their ids, and add it if they are ridden. Melhus had
    a few rides but held 7 to 11, and no more than 10 at midday, and Skaun
    6 or 7.
  - Seven Bolt systems in Entur are empty.
  - Lime Oslo is live but empty, and Zeus Oslo has been dead since 2021.
- **United Kingdom:**
  - Voi runs the most areas (London, Buckinghamshire, Cambridge, Essex,
    Gloucestershire, Northamptonshire, Oxford, Slough, Solent) but has no
    public feed. Access is asked from nap@voiapp.io, under a
    [licence](https://www.voi.com/voi-licencing-agreement) that allows showing
    the vehicles but forbids storing the data, which the scooter cache does.
  - Lime (London, West Midlands since April 2025, Salford, Milton Keynes)
    publishes no UK feed.
  - Neither DfT, TfL, the UK's access point for transport data nor any local
    portal publishes scooter positions.
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
