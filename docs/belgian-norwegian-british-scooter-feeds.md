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
Ryde's scooters in Asker, Bærum, Bodø, Lillestrøm and Lørenskog were added on
22 October 2026; see
[Ryde's five Entur systems, October 2026](#rydes-five-entur-systems-october-2026).

| Country | Operator | Enabled feeds | Coverage | Available scooters |
| --- | --- | ---: | --- | ---: |
| Belgium | Bolt | 1 | Bruxelles | 2,750 |
| Belgium | Dott | 2 | Bruxelles, Charleroi | 3,750 |
| Belgium | Pony | 1 | Charleroi | 220 |
| Belgium | Voi | 1 | Antwerpen | 925 |
| Belgium | Hoppy | 5 | Blankenberge, Kortrijk, Mechelen, Oostende (with Bredene), Sint-Niklaas | 1,225 |
| Norway | Voi | 9 | Oslo, Bærum / Asker, Lillestrøm / Lørenskog, Trondheim, Stavanger / Sandnes, Kristiansand / Vennesla, Arendal, Moss, Fredrikstad / Sarpsborg | 13,850 |
| Norway | Ryde | 16 | Oslo, Trondheim, Stavanger, Bærum, Lillestrøm, Tromsø, Lørenskog, Sandefjord, Bodø, Asker, Ålesund, Skien, Fredrikstad, Tønsberg, Porsgrunn, Sarpsborg | 18,000 |
| Norway | Bolt | 1 | Oslo | 4,930 |
| Norway | Dott | 2 | Trondheim, Stjørdal | 950 |
| United Kingdom | Beryl | 6 | Bournemouth / Christchurch / Poole, Brighton, Cornwall (Falmouth, Newquay, Penzance, Truro), Leeds, Norwich (with Wymondham), Plymouth | 2,200 |
| United Kingdom | Dott | 4 | Bath, Bristol (with Yate), Milton Keynes, Nottingham | 3,450 |
| United Kingdom | Bolt | 1 | Liverpool | 1,830 |

Belgium has 8 cities, Norway 22 and the United Kingdom 18, once multi-town
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

## Ryde's five Entur systems, October 2026

Entur's manifest listed 81 systems on 22 October 2026, against 76 on
16 October: the five new ones are Ryde's, `rydeasker`, `rydebaerum`,
`rydebodo`, `rydelillestrom` and `rydelorenskog`. They come through the same
API as Ryde's eleven others, as keyless GBFS 3.0 under Entur's NLOD licence,
and every feed URL is https, on the discovery's origin and under its
directory.

- **Liveness:** Ryde's `vehicle_id` changes, so each scooter was followed by
  the IMEI in its rental link. In four polls five minutes apart from 13:36 to
  13:51 on Thursday 22 October 2026, a scooter moved more than 150 m between
  two polls, or left one and came back more than 150 m away, 60 times in
  Bærum, 26 in Lørenskog, 23 in Bodø, 10 in Lillestrøm and 6 in Asker. Bærum
  listed about 1,700 available scooters, Lillestrøm 1,230, Lørenskog 880,
  Bodø 720 and Asker 660. Every vehicle listed was a scooter, though the
  feeds also define an e-bike type.
- **Prices:** NOK 10.90 to unlock and NOK 2.50 a minute, or NOK 2.20 in
  Lillestrøm.
- **Towns:** Asker, Bærum, Lillestrøm and Lørenskog are already towns of
  Voi's feeds, so each Ryde feed takes its town's name and centre. Bodø is a
  new town, with Bodo and Bodoe as aliases. Bærum, Lillestrøm and Lørenskog
  have their kommune's outline, which says where a scooter near a line
  counts; Asker and Bodø have none. As Ryde now runs in Bærum and Lørenskog,
  the scooters of Ryde's Oslo feed standing over the line there stay on the
  map, under those towns, while Bolt's are still left out.
- **Bounds:** the scooters seen, plus about 330 m (0.003° of latitude and
  0.006° of longitude). Ryde's zones include a world polygon, so they can't
  set them. Three disabled scooters of Lillestrøm's feed stood up to 35 km
  north; the map leaves out disabled scooters anyway.
- **Seasons and nights:** Lillestrøm's and Lørenskog's feeds pause from
  1 December to 1 March, as Voi's there, and Bodø's from 1 December to
  1 April; Asker and Bærum close in winter on dates not yet published (see
  [Night bans](#night-bans)). Lillestrøm's and Rælingen's weekend night bans
  already cover Ryde's scooters, by each kommune's boundary. Asker, Bærum and
  Lørenskog ban no hours, and Bodø kommune's page names none; its forskrift
  of 16 June 2022 could not be read, as Lovdata refused our requests.
- **Bodø:** the kommune's page names Ryde and Dott as the 2025 permit
  holders, with 250 scooters each. Ryde listed about 720 available on
  22 October 2026, and Dott publishes nothing for Bodø.

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
- **Prices** show for every operator. Beryl links no plan to its vehicles, so
  its scooters take the "Pay As You Ride" scooter plan each town's feed lists
  (`unlinkedScooterPlan`). Brighton's feed gives the weekday 20p every day, but
  Beryl charges 22p at weekends there, so a listed price
  (`data/listed-prices.json`) gives 22p on Saturdays and Sundays. Ryde and Dott start their per-minute band at minute 1, while their
  descriptions charge every minute; the parser reads it that way, so a ride
  estimate is at most one minute's fee above the letter of the band.
- **Night bans:** most Norwegian towns ban renting at night (see
  [Night bans](#night-bans)). Voi empties its Oslo feed during the ban, but
  Bolt and Ryde keep publishing their scooters as available, so the map shows
  them and says why they can't be rented.
- **Beryl's night pause:** during their night bans, from 22:00 in Bournemouth,
  Christchurch and Poole and from midnight in Brighton, until 05:00, Beryl's
  feeds for them list bikes only. Its other schemes keep their scooters. The
  feeds stay fresh, so the map shows the ban's notice for the town in view, not
  a provider that has stopped sharing data, and the feed-empty alert, which
  waits 3 days, stays quiet. In October 2026 the Bournemouth / Christchurch /
  Poole feed went from about 660 scooters to none, and back, at the first
  collection after 22:00 and after 05:00 every night: 22:17 and 05:17 on 15–16
  October, as nobody watched it and the cache collected it every 20 minutes.
- **Beryl's outage of 20 October 2026:** from 06:37 UTC its host, the same
  Firebase site as `gbfs.beryl.cc`, served an incomplete copy that did not
  change. Every scheme's station files answered 404, and so did
  `free_bike_status` in Bournemouth / Christchurch / Poole, Brighton, Leeds and
  Norwich. Cornwall's and Plymouth's stayed at 06:31. The discovery files still
  listed every feed. Dott and Bolt in Britain were not affected. All six areas
  have only Beryl, so the cache answered them 503 and the map said it couldn't
  refresh; it now names Beryl as not sharing data.
- **Bounds** enclose the scooters' positions over several polls, without strays
  far from the median, plus padding. In Norway they are also cut at municipal
  lines. Geofencing cannot set them there, because Ryde's zones include a
  world polygon. Voi's Stavanger / Sandnes feed crosses them: since 14 October
  2026 its Sandnes area reaches south to 58.765 N (from 58.8072), over Ganddal
  and Kvernaland, in Time, which are now its aliases, and its Stavanger area to
  58.868 N (from 58.8765), into Sola. 8 to 10 scooters stood there in each
  poll, at night and by day, inside Voi's zones, and the map left them out.
  Since 16 October 2026 its Sandnes area also reaches north to 58.896 N
  (from 58.8764), Sandnes's line at Forus and Lura, as Ryde's Sandnes area
  does: about 57 of Voi's scooters a poll stood there, inside Sandnes's
  kommune. They showed before, inside the Stavanger area's box, and counted
  under Sandnes by its outline, so the map is unchanged.
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
conditions. Twelve Norwegian towns and two British areas covered ban renting at
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
| Rælingen | Friday and Saturday, 23:00–05:00 | [FOR-2022-12-07-2621](https://lovdata.no/dokument/LF/forskrift/2022-12-07-2621) § 7 e |
| Arendal | Every night, 23:00–05:00 | [City page](https://www.arendal.kommune.no/tjenester/vei-parkering-og-havn/parkering/elsparkesykler/) |
| Porsgrunn | Every night, 23:00–05:00 | [Announcement 2026–27](https://skien.kommune.no/media/mrcb2f5v/2-kunngjoeringsdokument.pdf), "Tidspunkt for utleie" |
| Bournemouth, Christchurch, Poole | Every night, 22:00–05:00 | [Beryl](https://help-bikes.beryl.cc/en/articles/16098480-when-are-beryl-e-scooters-available-to-hire) |
| Brighton and Hove | Every night, 00:00–05:00 | [Council](https://www.brighton-hove.gov.uk/travel-and-road-safety/travel-transport-and-road-safety/beryl-e-scooters-trial) |

- A night is named after its evening: Friday's runs into Saturday morning.
- **Trondheim's** rule bans every night, but lets the city trial weekday
  nights, and Voi and Ryde open them. Only Friday and Saturday are sure.
- **Arendal's** rule says 00:00–05:00, its city page 23:00–06:00 and Voi, the
  only operator, 23:00–05:00. The map keeps the hours two of them agree on.
- Stavanger, Tromsø and Tønsberg also close on the eve of public holidays,
  which the map leaves out.
- **Rælingen** has no town outline, so the map counts its scooters, from Voi's
  Lillestrøm feed, under Lillestrøm; its night ban has its own boundary.
- **Porsgrunn's** hours come from the yearly announcement the four Grenland
  municipalities publish under their joint forskrift
  ([FOR-2022-06-16-1129](https://lovdata.no/dokument/LF/forskrift/2022-06-16-1129)),
  here for 1 April 2026 to 31 March 2027. It closes the whole municipality, so
  the Skien feed's scooters standing in Porsgrunn close too; Skien stays open
  and only slows scooters to 12 km/h from 00:00 to 05:00, which the map leaves out.
- **Winter:** some towns' rules allow renting only in a season, so their feeds
  have a seasonal pause, read as Ottawa's is
  ([Canadian feeds](canadian-scooter-feeds.md#winter)):
  - Lillestrøm, Lørenskog and Rælingen: March through November ("Vinterdrift
    tillates ikke", each forskrift's § 7 e), so Voi's Lillestrøm and Lørenskog
    feed and Ryde's two feeds pause from 1 December to 1 March.
  - Bodø: 1 April through 30 November. Bodø kommune's
    [page on rental e-scooters](https://bodo.kommune.no/tjenester/vei-vann-og-avlop/vei/elsparkesykkel/)
    (last changed 7 July 2026) gives the permits' season "i perioden 1. april
    til og med 30. november i 2025", so Ryde's feed pauses from 1 December to
    1 April. The page gives no terms for 2026; if Ryde's scooters are still
    ridden there in December, the season has changed and the pause goes.
  - Bærum and Asker close in winter too, on dates the town sets each year
    ([FOR-2026-02-04-201](https://lovdata.no/dokument/LF/forskrift/2026-02-04-201),
    [FOR-2026-02-03-213](https://lovdata.no/dokument/LF/forskrift/2026-02-03-213)).
    The draft Bærum put to consultation in October 2025 said in § 13:
    "Tjenesten er vinterstengt. Sesongstart og avslutning vil komme fram i
    kunngjøringen"
    ([høringsutkast](https://www.baerum.kommune.no/globalassets/politikk-og-samfunn/politikk/kunngjoringer-og-horinger/horingsutkast-til-forskrift-om-utleie-av-sma-elektriske-kjoretoy-pa-offentlig-grunn-barum-kommune.pdf)),
    and its season ended on 10 December in 2025. Neither town had published
    its dates for 2026–27 by 22 October 2026, so Voi's and Ryde's feeds there
    have no pause yet.
  - Tromsø: 1 May through 1 November
    ([FOR-2025-09-03-1800](https://lovdata.no/dokument/LF/forskrift/2025-09-03-1800)
    § 2 f), so Ryde's feed pauses from 2 November to 1 May.
  - Trondheim: "i utgangspunktet" 15 March to 1 December, and closed when snow
    or ice is likely
    ([FOR-2022-02-08-192](https://lovdata.no/dokument/LF/forskrift/2022-02-08-192)
    § 3), so Voi's, Ryde's and Dott's feeds pause from 2 December to 15 March.
  - Skien and Porsgrunn: from 15 December until the streets are clear, with
    no set end. Skien kommune's
    [Sykkel page](https://www.skien.kommune.no/kultur-idrett-og-frivillighet/parker-og-friluftsliv/sykkel/),
    under "Leie el-sparkesykkel", says of Ryde's scooters in Grenland:
    "Syklene er ikke tilgjengelig for utleie på vinteren. Det vil si fra 15.
    desember til det er snø- og isfritt på våren." For Porsgrunn, the joint
    forskrift its bystyre adopted
    ([FOR-2022-06-16-1129](https://lovdata.no/dokument/LF/forskrift/2022-06-16-1129)
    § 3) allows only e-bikes with studded tyres "i vintersesongen når det er
    fare for snø og is"; Porsgrunn's
    [page for 2026](https://www.porsgrunn.kommune.no/lokalpolitikk/hoeringer/utleie-av-elsparkesykler-2026/)
    and the 2026–27 announcement it links, the same document as Skien's, set
    no winter date, and Ryde holds the one permit for all of Grenland. So
    Ryde's Skien feed, with its Porsgrunn area, and its Porsgrunn feed pause
    from 15 December with `"until": "clear"` (read on 18 October 2026).
- **An open end:** a pause until the streets are clear holds until 1 May at
  the latest (`CLEAR_BY` in `src/lib/seasonalPauses.ts`), when Tromsø, the
  northernmost town covered, starts its season. The feeds' alerts stay quiet
  until then, even if Ryde is back weeks earlier, and come back on 1 May
  whether it is or not: "feed empty" then reports a feed still empty 3 days
  later. The dock shows "Off season in Skien: from 15 December until the
  streets are clear" only while no scooter is in view, so it gives way as
  soon as Ryde's scooters are back on the map, whichever day that is. A
  rider zoomed in on a street with none still sees it.
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
    Gogo) and Larvik (Ryde) have scooters but no public source. Entur,
    Norway's only public aggregator, has none of them: its GraphQL API sees no
    scooter its manifest lacks, and guessed system ids answer 404. Ryde's
    fleet in Kristiansand is missing too: of Ryde's towns that Entur lacked
    until October 2026, only Asker, Bærum, Bodø, Lillestrøm and Lørenskog were
    in its manifest on 22 October 2026. Dott, Bodø's other permit holder in
    2025, publishes nothing for Bodø.
  - Dott Malvik, Melhus and Skaun hold fewer than twenty scooters each, and
    e-bikes, which the map leaves out. Malvik listed 15 to 17 available
    scooters in 27 polls on the evening of 13 October 2026 and 12 at midday
    on the 14th, but none was ridden: Dott deployed two, swapped a low one
    for a charged one and collected another, all without a ride. On Sunday
    18 October it held 17, and none moved in 16 polls from 12:07 to 13:23.
    Check it again in April 2027, matching scooters by position, since
    Entur renews their ids, and add it if they are ridden. Melhus had
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
