# Portuguese, Spanish and Icelandic scooter feeds

Verified 12 October 2026. The audit started from the
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
then probed the URL patterns of Bird, Hopp, Lime, Bolt, Cooltra and BORA for
other towns. Each enabled feed was polled nine times, five minutes apart, on a
weekday afternoon: counts changed between polls, every feed was under a minute
old, and every feed URL is https, on the discovery's origin and under its
directory. No account credentials or private rider APIs are used.

Hoppy's scooters were added on 14 October 2026: in Puerto del Carmen, on
Lanzarote, then on Tenerife, Fuerteventura and the Costa Blanca; see
[Hoppy in Puerto del Carmen](#hoppy-in-puerto-del-carmen-october-2026) and
[Hoppy on Tenerife, Fuerteventura and the Costa Blanca](#hoppy-on-tenerife-fuerteventura-and-the-costa-blanca-october-2026).
Hopp's scooters in Egilsstaðir and Hveragerði, Iceland, were added the same
day; see [Hopp in Egilsstaðir and Hveragerði, October 2026](#hopp-in-egilsstaðir-and-hveragerði-october-2026).
Lime's scooters in Porto, Faro and Oeiras, about 430, 280 and 180, were added
on 25 October 2026 from its authenticated rider map, each market whole after
a clean full-area audit; see
[the Lime guide](lime-app-map.md#every-market-the-map-lists-october-2026).
The table lists the public feeds.

| Country | Operator | Enabled feeds | Coverage | Available scooters |
| --- | --- | ---: | --- | ---: |
| Portugal | Bird | 10 | Lisboa, Porto, Cascais, Oeiras, Almada (with Costa da Caparica), Coimbra, Maia, Matosinhos, Portimão, Olhão | 4,350 |
| Portugal | Lime | 2 | Lisboa, Almada (with Costa da Caparica) | 2,300 |
| Spain | Bird | 5 | Gijón, Getafe, Playa de las Américas (Tenerife), Caleta de Fuste and Pájara (Fuerteventura) | 1,250 |
| Spain | Hopp | 3 | Torrevieja and Pilar de la Horadada, Jávea, Playa de las Américas and Golf del Sur (Tenerife) | 550 |
| Spain | Hoppy | 6 | Puerto del Carmen (Lanzarote), Playa de las Américas (Tenerife), Corralejo and Caleta de Fuste (Fuerteventura), Altea, L'Albir, L'Alfàs del Pi and La Nucía (Marina Baixa), Torrevieja | 2,350 |
| Iceland | Hopp | 15 | Reykjavík and its capital area, Reykjanesbær (with Sandgerði, Garður and Vogar), Akureyri, Selfoss, Akranes, Vestmannaeyjar and nine smaller towns | 2,750 |

Portugal has 11 cities, Spain 16 and Iceland 19, once multi-town feeds are
routed per town. The bounds, discovery URLs and aliases are in
[`portuguese-scooter-feeds.json`](../data/portuguese-scooter-feeds.json),
[`spanish-scooter-feeds.json`](../data/spanish-scooter-feeds.json) and
[`icelandic-scooter-feeds.json`](../data/icelandic-scooter-feeds.json).

## Hoppy in Puerto del Carmen, October 2026

Hoppy, already on the map in Belgium and Croatia, runs scooters in
Puerto del Carmen, in Tías on Lanzarote, on ATOM Mobility:
`https://hoppy.rideatom.com/gbfs/1776/v3.0/gbfs`. The feed is keyless
GBFS 3.0, and every feed URL is https, on the discovery's origin and under its
directory. Its timezone reads Europe/London, which keeps the Canaries' time.

- **Liveness:** ATOM stamps `last_updated` with the time of the request and
  gives no `last_reported`, and a scooter's `vehicle_id` changes after each
  ride, so each scooter was followed by the code at the end of its rental
  link. It was polled 148 times, every five minutes, from 23:43 CEST on
  Tuesday 13 October to 10:28 the next morning, and listed 148 to 160
  available scooters. Four rides came back 0.5 to 3.0 km away under a new id,
  with 3 to 11 km less range, two of them at night; two more scooters moved
  0.3 and 0.6 km with a little less range and their old id.
- **Scooters:** both vehicle types are `scooter_standing`, `electric`, with a
  60 km maximum range. Hoppy's systems on Tenerife, Fuerteventura and the
  Costa Blanca are in the next section; its other Spanish systems carry
  e-bikes or nothing (see [Known gaps](#known-gaps)).
- **Bounds:** ATOM's geofencing forbids starting or ending a ride everywhere
  (`global_rules`) and allows both in 58 parking zones along the resort. The
  bounds enclose those zones, plus 0.005° of latitude and 0.01° of longitude;
  every scooter seen stood inside them. Tías, Tias and Lanzarote are aliases.
- **Prices:** EUR 1.20 to start, then EUR 0.35 or 0.37 a minute, by tier.
- **Battery:** range only, as for Hoppy in Belgium.
- **Rental links** (`https://ride-hoppy.app.link/<code>`) name each scooter by
  its printed code, not by a hardware id, so they are kept.
- **Load:** the scooter cache asks for the feed's `vehicle_status` every 20
  minutes, or every minute for 10 minutes after someone looks at the town, and
  its metadata once an hour. So Puerto del Carmen's feed adds about 8
  requests an hour to `hoppy.rideatom.com`, and at most about 65 while
  watched; see
  [ATOM's request rate](german-italian-scooter-feeds.md#atoms-request-rate-october-2026).

## Hoppy on Tenerife, Fuerteventura and the Costa Blanca, October 2026

Hoppy runs five more Spanish scooter systems on ATOM Mobility, at
`https://hoppy.rideatom.com/gbfs/<id>/v3.0/gbfs`. Each is keyless GBFS 3.0,
and every feed URL is https, on the discovery's origin and under its
directory.

| Hoppy's system (id) | On the map as | Available scooters |
| --- | --- | ---: |
| Tenerife Sur (1193) | Playa de las Américas | 991–1,013 |
| Corralejo (Fuerteventura) (1477) | Corralejo | 179–195 |
| Antigua (Fuerteventura) (1188) | Caleta de Fuste | 168–174 |
| Benidorm (Marina Baixa) (906) | Altea, L'Albir, L'Alfàs del Pi and La Nucía | 311–325 |
| Torrevieja (876) | Torrevieja | 484–493 |

- **Liveness:** each scooter was followed by the code at the end of its rental
  link, as in Puerto del Carmen. The three Canary feeds were polled 25 to 27
  times, every five minutes from about 00:30 to 01:48 CEST on 14 October (an
  hour earlier in local time) and again from 11:41 to 12:31; the two Costa
  Blanca feeds 21 times, from 11:22 to 12:31. Between polls up to 20 minutes
  apart, Tenerife Sur had 31 rides, Corralejo 5, Caleta de Fuste 3, the Marina
  Baixa 10 and Torrevieja 4: each scooter came back 0.3 to 3.3 km away under a
  new id, with 0.6 to 12 km less range. Over the morning gap, another 69
  scooters on Tenerife, 24 in Corralejo and 15 in Caleta de Fuste moved under a
  new id with less range. Torrevieja's were the quietest: three scooters made
  its four rides, and the rest barely moved.
- **Scooters:** the map keeps the `scooter_standing`, `electric` types, with a
  60 km maximum range, or 40 km for some of Torrevieja's. The Marina Baixa
  system also lists about 90 e-bikes, and types for mopeds and mobility
  scooters; Torrevieja's has a moped type and an e-bike type. The app drops
  them all.
- **Town names:** Hoppy is a different operator from Bird and Hopp, but its
  towns take the names the map already uses, so search and the city count
  show each town once. Tenerife Sur's scooters stand from Los Cristianos to
  Costa Adeje, so it is Playa de las Américas, with Bird's and Hopp's.
  "Antigua (Fuerteventura)" is named after the municipality, and its scooters
  stand in Caleta de Fuste, with Bird's. Torrevieja joins Hopp's Costa Blanca
  town of that name. Corralejo is new.
- **Marina Baixa:** the system is named after Benidorm, but its parking zones
  and scooters lie almost all north of the town. By OpenStreetMap's municipal
  boundaries, at 12:06 on 14 October 113 of its 318 scooters stood in Altea,
  144 in L'Alfàs del Pi (with L'Albir), 42 in La Nucía, 7 in Polop, 8 at
  Benidorm's northern edge and 4 in Finestrat. The towns' boundaries interlock,
  so the feed is routed to four boxes that don't overlap: Altea north of
  38.58° N and east of 0.08° W; L'Albir, the beach district of L'Alfàs del Pi,
  south of it; L'Alfàs del Pi between 0.08° and 0.122° W, which also takes the
  scooters at Benidorm's edge; and La Nucía west of that, with Polop as an
  alias. A scooter near a boundary can count towards the next town. Four
  scooters parked together in Finestrat, 5 km from the rest, are left out, as
  are the system's parking zones in El Campello, near Alicante, where no
  scooter stood. Hopp's own Benidorm feed is empty too (see
  [Known gaps](#known-gaps)).
- **Torrevieja:** every scooter stood in Torrevieja. The system's zones also
  cover Orihuela Costa, Pilar de la Horadada and San Miguel de Salinas, where
  none stood, so the bounds keep to Torrevieja; La Mata is an alias.
- **Bounds:** ATOM's geofencing is again one no-ride polygon without a hole,
  so the bounds enclose the parking zones open to the scooter types and the
  scooters' positions, plus 0.005° of latitude and 0.01° of longitude: 278
  zones on Tenerife, 35 in Corralejo, 98 in Caleta de Fuste, 583 on the
  Marina Baixa and 346 in Torrevieja.
- **Prices:** EUR 1.00 to start (EUR 1.20 in Corralejo), then EUR 0.28 to 0.37
  a minute, by tier and town.
- **Battery:** range only. **Rental links** name each scooter by its printed
  code, so they are kept.
- **Time zone:** the three Canary feeds give `Europe/London`, which keeps the
  same offsets as `Atlantic/Canary`, and the two on the Costa Blanca
  `Europe/Madrid`. All give opening hours of `24/7`.
- **Load:** the five feeds add about 40 requests an hour to
  `hoppy.rideatom.com`, which now carries 16 feeds and about 130 requests an
  hour while nobody looks, and at most about 65 each while watched; see
  [ATOM's request rate](german-italian-scooter-feeds.md#atoms-request-rate-october-2026).

## Hopp in Egilsstaðir and Hveragerði, October 2026

Hopp runs scooters in Egilsstaðir, the main town of East Iceland, and in
Hveragerði, east of Reykjavík. Their feeds are at the address Hopp uses for
its other Icelandic towns:
`https://api.hopp.bike/gbfs/is-egilstadir/gbfs.json`, which Hopp spells with
one s, and `https://api.hopp.bike/gbfs/is-hveragerdi/gbfs.json`. Both are
keyless GBFS 2.2, and every feed URL is https, on the discovery's origin and
under its directory.

| Town | Available scooters | Rides traced |
| --- | ---: | ---: |
| Egilsstaðir | 21 to 23 | 11 |
| Hveragerði | 19 to 22 | 13 |

- **Liveness:** both feeds were polled 27 times from 16:52 to 22:20 Iceland
  time on Tuesday 13 October, five then ten minutes apart, with a gap from
  19:07 to 20:37, and six times from 10:25 to 10:51 on Wednesday the 14th.
  Hopp stamps `last_updated` with the time of the request (`ttl` 0), so the
  age limit can't tell how old its positions are, and gives a scooter a new
  `bike_id` after each ride. So rides were traced by the code printed on
  each scooter (`hopp_code`): a scooter that left the feed and came back
  elsewhere, under a new id, with less charge. In Egilsstaðir 6 scooters made
  11 rides, of 0.2 to 1.6 km, with 1 to 24 points less charge. In Hveragerði
  6 scooters made 13, of 0.4 to 1.2 km, with 3 to 12 points less, one of
  them ending empty; two more moved 0.2 and 0.8 km with no charge lost.
  Overnight one more scooter was ridden in each town, about 1 km; on
  Wednesday morning the counts held at 23 and 21 and no scooter was ridden
  in the half hour polled.
- **Codes shared by two scooters:** the feed masks all but the last three
  digits of each code, so two scooters can report the same one: `XX755` in
  Egilsstaðir and `XX681` in Hveragerði, in each case one available and one
  disabled with an empty battery. Rides were matched on code and position.
- **Bounds:** Hopp's geofencing has one no-riding polygon around each town,
  whose holes are the operating area, as in Hopp's Polish and Greek towns.
  The bounds are those holes plus 0.005° of latitude and 0.01° of
  longitude, about 550 m and 470 m. Egilsstaðir's take in Fellabær, across
  the bridge over Lagarfljót, where its scooters go too. One available
  Hveragerði scooter stood in Selfoss, 11 km east, in every poll; the bounds
  leave it out, so the map shows it only when it takes in Hveragerði too.
  Every other scooter of every poll stood inside the bounds.
- **Search:** Egilsstaðir is also found as Egilsstadir, as Hopp's
  Egilstadir, as Fellabær and as Múlaþing, its municipality; Hveragerði as
  Hveragerdi.
- **Vehicle types:** each type in both feeds is an electric scooter.
- **Prices:** ISK 115 to start and ISK 45 a minute, as in Hopp's other
  Icelandic towns. Hveragerði's pricing feed also lists a plan in Danish
  kroner that no scooter used.
- **Time zone:** both feeds give `UTC`, which is Iceland's time all year.

## Hopp Dalvík's and Ólafsvík's winter, October 2026

Hopp took its Dalvík scooters in on 19 and 20 October 2026: the feed held 7 or
8 available scooters on the 19th, 4 that evening, 2 at 18:30 on the 20th and
none from 19:00 (UTC, the scooter cache's counts). On 22 October it listed one
scooter, not available. Neither Hopp ([locations](https://hopp.bike/locations))
nor Dalvíkurbyggð publishes a season; the municipality's
[notice of 26 April 2024](https://www.dalvikurbyggd.is/is/frettir-og-tilkynningar/hopp-til-dalvikurbyggdar)
says Hopp had just started there with 20 scooters. So that "feed empty" doesn't
report the town all winter, the catalog pauses Dalvík from 21 October until 1
May, in `Atlantic/Reykjavik`: the map says the scooters are back in May, and the
alerts are muted. The dates are 2026's; check in late April 2027 when the
scooters come back ([coverage gaps](coverage-gaps.md)). Siglufjörður, emptied a
week earlier, left the catalog instead (see [Known gaps](#known-gaps)).

Hopp's Snæfellsbær feed (Ólafsvík and Hellissandur) went the same way, more
slowly: about 20 available scooters on 13 October 2026, 10 on the 16th, 5 on
the 18th, 2 from the afternoon of the 21st and none from 11:00 on the 22nd
(UTC, the scooter cache's counts), when it listed no vehicle at all. Neither
Hopp nor Snæfellsbær publishes a season, so the catalog pauses both towns from
23 October until 1 May, as Dalvík; check in late April 2027.

## Data handling

- **Bird's "madrid" feed is Getafe.** Its scooters stand in Getafe's
  industrial estates, where Bird has run with the council since June 2025, so
  the catalog names it Getafe. Its "adeje" feed also covers Arona, and is named
  Playa de las Américas, where Hopp's Tenerife feed overlaps it. Its bounds
  reach 28.115 N and 16.763 W since 14 October 2026, about half a kilometre
  beyond Bird's ride zone (to 28.1108 N, 16.7587 W): the old ones stopped at
  28.1027 N and 16.7528 W and left out 11 or 12 scooters parked in Costa Adeje.
- **Town outlines:** Costa da Caparica's box, which runs north to 38.68° N,
  took in Trafaria and São João da Caparica, in Almada's parish of Caparica e
  Trafaria, where Lime and Bird park: 24 scooters there counted under Costa
  da Caparica in each of two polls on the evening of 15 October 2026. Almada and
  Costa da Caparica now have their outlines in
  [`town-outlines.json`](../data/town-outlines.json), OpenStreetMap's municipality
  and parish, simplified to within 20 m; the parish lies inside the
  municipality, and a scooter in both counts under the smaller, Costa da
  Caparica. After: 3 a poll, between Lisboa, Oeiras, Cascais and Matosinhos,
  which keep their boxes for so few. The box still reaches Trafaria, and
  should: Almada's own box stops at 9.205° W, so it is what keeps those
  scooters on the map, and Almada's outline counts them under Almada (24 a
  poll, 5 of Bird's and 19 of Lime's, in four polls on the night of 15 to 16
  October 2026; none dropped). Costa da Caparica answered to "Caparica" too
  until 16 October 2026. It needs no such alias, as search finds a town by
  any word of its name, and the alias made "…, Caparica" in an address mean
  Costa da Caparica, though it is the postal locality of the inland parish
  of Caparica (Monte de Caparica, the NOVA campus): such an address was
  looked for without its town, within 15 km of the beach. In Spain, 7 of
  Hoppy's scooters a poll in La Nucía, east of 0.122° W, counted under
  L'Alfàs del Pi; La Nucía now has its outline, and none is misnamed.
- **Reykjavík's capital area** is one city, with Kópavogur, Hafnarfjörður,
  Garðabær, Mosfellsbær and Seltjarnarnes as aliases: their boxes would
  overlap.
- **Vehicle types:** Hopp Reykjavík also lists electric cars, and Bird and Lime
  mix in e-bikes. The app keeps electric scooters only. Bird Barcelona files
  552 e-bikes under its scooter type in its station feed; it is left out.
- **Prices** show for Hopp and Hoppy: ISK 115 to unlock and ISK 45 a minute in
  Iceland, EUR 0.95–0.99 and EUR 0.25–0.33 a minute for Hopp in Spain, and
  EUR 1.00–1.20 and EUR 0.28–0.37 for Hoppy. The króna has no
  minor unit, so web and iOS show it without decimals. Bird publishes an empty
  plan list and Lime no pricing feed.
- **Battery:** Lime gives range only, as elsewhere, so Lime scooters show no
  battery level. Hopp's comes from its `hopp_battery_level` field.
- **Rental links:** Hopp and Hoppy link each scooter; Bird and Lime fall back
  to their app.
- **IDs:** Bird and Lime rotate every vehicle id on every poll.

## Night bans

**Matosinhos** bans renting every night, 22:00–06:00, under Art. 20.º of its
[municipal regulation](https://www.cm-matosinhos.pt/cmmatosinhos2020/uploads/writer_file/document/33006/regulamento_municipal_de_servicos_de_partilha_em_modos_suaves_de_transporte.pdf)
(Edital n.º 1608/2022). Its boundary is the municipality from the Direção-Geral
do Território's [CAOP](https://www.dgterritorio.gov.pt/cartografia/cartografia-tematica/caop),
under CC BY 4.0: *Informação geográfica cedida pela Direção-Geral do
Território*. Bird keeps listing its scooters as available during the ban. On
12 October 2026 it listed 228 scooters at 17:05, 225 of them available. Polled
at 22:16, 22:21 and 22:26 Lisbon time, it listed 223, 232 and 233, with 219,
228 and 228 available; none was reserved. So the map keeps showing them, and
the dock and each scooter's card state the ban and when renting resumes.

- Porto lifted its 06:00–22:00 rule in November 2025
  ([Regulamento n.º 1222/2025](https://mobilidade.cm-porto.pt/files/uploads/cms/CRMP_vers%C3%A3o_atualizada_20251127.pdf)).
- Reykjavík's
  [2026 rules](https://reykjavik.is/sites/default/files/2026-02/Verklagsreglur_um_stöðvalausar_hjólaleigur_2026.pdf)
  (§5.5.1) let the city limit rental hours, but it has not.
- **Egilsstaðir and Hveragerði:** no rule on renting hours was found.
  [Múlaþing's list of its rules](https://www.mulathing.is/is/stjornsysla/reglur-samthykktir-og-stefnur/reglur-i-mulathingi),
  59 of them, has none on scooters, and neither town's site nor the local
  press mentions any.
- **Tías** (Puerto del Carmen): Hoppy's feed gives opening hours of `24/7`,
  and no rule on renting hours was found. The town's police removed 34 rental
  scooters from Puerto del Carmen's streets in July 2024
  ([La Voz de Lanzarote](https://www.lavozdelanzarote.com/en/news/politics/tias-removes-34-rental-scooters-from-public-roads-in-puerto-del-carmen_228016_102.html))
  and 71 left on pavements and promenades in one week of July 2026
  ([La Voz de Lanzarote](https://www.lavozdelanzarote.com/en/news/politics/security-and-order-in-tias-the-police-remove-71-electric-scooters-what-does-this-mean-for-you_244876_102.html)).
  The town says rental firms without a licence break its bylaws. Neither
  report names Hoppy. No curfew was added.
- **Adeje** (Playa de las Américas) approved a new mobility ordinance in May
  2026 that makes rental firms hold a municipal authorisation, but the report
  names no rental hours
  ([Diario de Avisos](https://diariodeavisos.elespanol.com/2026/05/adeje-cambia-normas-patinetes-acampar/)).
  Hoppy's five new feeds give opening hours of `24/7`, and no rule on renting
  hours was found for Arona, La Oliva, Antigua, Altea, L'Alfàs del Pi, La
  Nucía or Torrevieja. No curfew was added.
- No other covered town was found to ban renting at night. The small Spanish
  and Portuguese towns had only a quick search.

## Licences

- **Bird:** the `license_url` in its feeds answers 404, and Bird's agreement
  page now redirects to its rider terms. The
  [last archived copy](https://web.archive.org/web/20260516143232/https://www.bird.co/gbfs-data-license-agreement/)
  allows showing Bird's vehicles, identified as Bird's, with data no older than
  fifteen minutes. Worth confirming with Bird that it still applies.
- **Lime:** its [GBFS terms](https://www.li.me/legal/public-gbfs-terms) allow
  internal use, and public display only where local law requires Lime to grant
  it, with data no older than ten minutes. No Portuguese rule was found that
  does; this is the same open question as for Lime in France and Germany.
- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in Germany.
- **Hoppy** publishes no licence in its feed, as in Belgium.
- The credits name Bird, Lime, Hopp and Hoppy for these countries, and the DGT for
  Matosinhos's boundary.

## Known gaps

- **Portugal:**
  - Bolt runs in Lisboa, Porto, Faro, Coimbra and elsewhere. Its GBFS is on
    Portugal's access point
    ([entry 10219](https://nap-portugal.imt-ip.pt/nap/), 6 January 2026) only
    "on request, case by case", with possible costs. Porto's FIWARE broker
    (`broker.fiware.urbanplatform.portodigital.pt`) holds about 1,000 Bolt
    scooters, but it is unlicensed and hadn't been updated since 8 October
    2026 when polled on the 16th, nor on the 25th (927 Bolt, 494 Bird and 20
    Circ scooters). Since 25 October 2026 Bolt's scooters in Lisboa with
    Oeiras, Porto with Matosinhos, Coimbra, Faro and Santarém come from its
    authenticated [rider map](bolt-app-map.md). Lime has no public feed for
    Porto or Faro (404); its scooters there and in Oeiras come from its rider
    map since the same day. Link and Whoosh have left Portugal.
  - Lisboa is ending shared scooters. Mayor Moedas announced it on 15 October
    2026 ([Observador](https://observador.pt/2026/10/15/camara-de-lisboa-avanca-com-suspensao-do-sistema-de-trotinetes-partilhadas-ate-ao-final-do-ano/),
    [ECO](https://eco.sapo.pt/2026/10/16/moedas-anuncia-suspensao-de-trotinetes-partilhadas-em-lisboa/)),
    and on 21 October the council approved, with Livre and IL against, ending
    its 2023 agreement with the operators "por razões de interesse público"
    and banning their scooters from riding and parking in the municipality.
    After 10 days for the operators to answer in writing, they have 60 days
    to remove every scooter, by the end of the year by Lusa's account; then
    the council may remove them at their cost
    ([Observador, 21 October](https://observador.pt/2026/10/21/camara-de-lisboa-aprova-suspensao-das-trotinetes-partilhadas-livre-e-il-votaram-contra/)).
    Bird and Lime Lisboa will then empty; see [coverage gaps](coverage-gaps.md).
  - Braga banned shared scooters in September 2026; Espinho, Vila Real and
    Figueira da Foz ended or suspended them. Bird's Braga and Faro feeds are
    dead, and seven smaller Bird towns are empty.
  - Bird Vila Nova de Gaia held 7 scooters that did not move; the city
    cancelled its tender in April 2026.
- **Spain:**
  - Madrid, Barcelona, Valencia, Sevilla, Málaga, Zaragoza and the Basque
    Country have no shared scooters: banned, revoked or never licensed.
  - Lime's rider map still lists Madrid, Alcorcón, Málaga and Sevilla. A
    full-area audit on the night of 25 October 2026 found no Lime scooter in
    any of them. Madrid revoked Lime's, Dott's and Tier's licences in
    September 2024
    ([Ayuntamiento de Madrid, 5 September 2024](https://diario.madrid.es/blog/notas-de-prensa/madrid-revoca-las-autorizaciones-de-patinetes-de-alquiler-y-ya-no-podran-circular-por-sus-calles/)).
  - Dott runs Santa Cruz de Tenerife alone, with 646 scooters, and lists
    Lanzarote, Murcia, Tarragona, Lorca, La Manga and Estepona. Its public API
    names no Spanish region: `ibiza`, `murcia`, `tarragona`, `lorca` and
    `la-manga` answer 403 (`ERR_REGION_OFFLINE`), Murcia's and Tarragona's
    since mid-August 2026, and the others 404. Ibiza's 18-month pilot from May
    2024 seems to have ended.
  - Bird runs Oviedo (200 scooters and 100 e-bikes, on a four-year concession
    from June 2025, after Bolt's) with no public system: `oviedo` answers 404.
  - Las Palmas de Gran Canaria's public Sítyneta (87 scooters at 13 stations,
    run by Sagulpa and booked in the Moxsi app) isn't in nextbike's feeds,
    which list bicycles only.
  - Islaride, by Grupo Tambor, says it runs more than 500 scooters on several
    Canary Islands, on ATOM Mobility (`isla-ride.rideatom.com`). Its system
    id isn't public, so no feed was found (18 October 2026).
  - Spain's access point (nap.transportes.gob.es) carries public transport
    only, with no shared-mobility data, as of 16 October 2026.
  - Hopp's Benidorm, Cartagena, Dénia, Fuengirola and Marbella feeds are empty.
  - Hoppy's other Spanish systems on ATOM Mobility list no scooters. Almería
    (id 2113, about 480 e-bikes on 13 October 2026), Cartagena (2206, about
    230) and Mojácar & Vera (2232, about 150) carry e-bikes only, and Roquetas
    de Mar (2223), Magic World Resort (1393) and Cabo de Gata - Níjar (2272)
    were empty.
- **Iceland:**
  - Bolt has run in the capital area since 2024, with no public feed. Its
    Reykjavík market, 851 scooters on 25 October 2026, comes from its
    [rider map](bolt-app-map.md) since that day.
  - Hopp's Hella / Hvolsvöllur feed (5 available of 17 on 13 October 2026)
    and Ísafjörður's (3 of 16) held under ten available scooters, and
    Grindavík, Höfn, Seyðisfjörður, Blönduós, Ólafsfjörður and Þorlákshöfn
    none. Hveragerði, also under ten when first checked, held 19 to 22 on 13
    October and was added; Egilsstaðir was added with it.
  - Hopp Siglufjörður held about 20 scooters from 12 October 2026 until the
    evening of the 13th, when they went: 10 at 18:40, 1 at 19:40 and none
    from 20:40 (UTC, the scooter cache's counts). The feed then listed no rows
    at all, in the audit's polls from 22:00 to 22:10, at 22:40 and again at
    09:20 on the 14th, while Dalvík and Sauðárkrókur, nearby, still listed
    theirs. Its discovery, vehicle types and geofencing zones are still
    published, so Hopp has probably taken the scooters in for the winter, but
    neither Hopp ([locations](https://hopp.bike/locations)) nor Fjallabyggð
    (its [2023 launch notice](https://www.fjallabyggd.is/is/frettir/hopp-maett-til-fjallabyggdar))
    publishes a season, so there are no dates for a `seasonal` window. The
    feed left the catalog on 15 October 2026, and Siglufjörður the map's
    towns. Check it in spring 2027, and add it back if it again holds about
    ten available scooters that are ridden.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=PT,ES,IS --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
