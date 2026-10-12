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
  world polygon.

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
- **Voi** (Antwerpen) and **Hoppy** publish no licence in their feeds.

## Known gaps

- **Belgium:**
  - Brussels bans shared e-scooters from 1 January 2027, when Bolt's and
    Dott's permits end ([La Libre, 11 June 2026](https://www.lalibre.be/belgique/mobilite/2026/06/11/grand-changement-dans-le-secteur-de-la-mobilite-bruxelles-interdit-les-trottinettes-partagees-sur-son-territoire-IRS4BZDEPFFS3H6MJT23AUASK4/)).
    Their Brussels feeds should empty then.
  - Pony (Brussels, Liège, Charleroi) answers 400 to the key in the registry.
  - Lime Brussels and Kortrijk, Dott Ghent and Mons, and Bolt Ghent publish
    e-bikes only.
  - Lime Antwerp answers 404.
  - Bird Antwerp has been empty for years.
  - Dott Liège answers 403, and Dott Kortrijk 404.
  - Hoppy has only one public system out of the ids scanned. Its other
    cities answer 401.
- **Norway:**
  - Bergen (Ryde, Lime and RideMovi, about 9,000 scooters), Drammen (Ryde,
    Gogo), Larvik and Bodø (Ryde) have scooters but no public source. Entur,
    Norway's only public aggregator, has none of them: its GraphQL API sees no
    scooter its manifest lacks, and guessed system ids answer 404. Ryde
    publishes only the 11 systems in the catalog, so its fleets in Bærum,
    Lillestrøm, Lørenskog and Kristiansand are missing too.
  - Dott Malvik, Melhus and Skaun hold fewer than twenty scooters each.
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
