# German and Italian scooter feeds

Verified 8 September 2026. The audit checked 156 scooter candidates from the
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
plus Dott's published country index and selected public Italian alternatives.
No account credentials or private rider APIs were needed for the enabled feeds.

Rechecked 11 October 2026. In September Dott made its GBFS API private
([it now requires authentication](https://ridedott.dev/docs/services/gbfs/introduction/)).
Its public German listing now names 15 regions, and they all still answer. Of
the 82 German Dott regions enabled on 8 September, 65 answered 404
(`ERR_REGION_NOT_FOUND`), and Kassel and Lübeck had answered 403
(`ERR_REGION_OFFLINE`) since late September. Those 67 were removed.

Zeus was added the same day: 14 feeds, about 2,200 available scooters. Zeus
publishes its own GBFS 2.2 feeds at `zeus.city`, and MobiData BW republishes
the scooters of its newer backend as GBFS 3.0. Where both cover a city, only
one source is read, so no scooter is counted twice: the MobiData BW feed, which
is the live one (Zeus's own Freiburg, Renningen and Tuttlingen feeds are
subsets of it; its own Würzburg and Neustadt feeds hold a few scooters on
depots). Zeus's own Heidelberg feed lies inside MobiData BW's Leimen / Walldorf /
Wiesloch feed, and its Hemmingen feed inside its Ludwigsburg feed.

Yoio was added on 13 October 2026: 3 feeds, about 675 available scooters, in
Göttingen, Freiburg im Breisgau and Erfurt; see [Yoio, October 2026](#yoio-october-2026).

Voi's Böblingen and Sindelfingen scooters, about 190, joined the map the same
day; see [Voi in Böblingen and Sindelfingen, October 2026](#voi-in-böblingen-and-sindelfingen-october-2026).

Zeus is moving its towns from `zeus.city` to ATOM Mobility. As checked on
13 October 2026, that changes nothing on the map yet, and ten towns it has
moved publish no feed with scooters; see
[Zeus's move to ATOM Mobility, October 2026](#zeuss-move-to-atom-mobility-october-2026).

Italy grew from Rome to three cities on 13 October 2026, with Bird Palermo and
Bird Napoli; see [Italy, October 2026](#italy-october-2026). Elerent's
scooters in Catania followed on 14 October 2026; see
[Elerent in Catania, October 2026](#elerent-in-catania-october-2026).

| Country | Operator | Enabled feeds | Coverage |
| --- | --- | ---: | --- |
| Germany | Dott | 15 | Aachen, Berlin, Düsseldorf, Essen, Hannover, Heidelberg, Heilbronn, Kaiserslautern, Köln, Langenfeld, Leipzig, München, Münster, Potsdam and Stuttgart |
| Germany | Bolt | 3 | Karlsruhe, Stuttgart, Reutlingen / Tübingen |
| Germany | Hopp | 1 | Konstanz |
| Germany | Lime | 3 | Frankfurt, Wuppertal, Stuttgart / Konstanz |
| Germany | Voi | 1 | Karlsruhe, Pforzheim, Mannheim, Ludwigshafen am Rhein, Stuttgart, Böblingen, Sindelfingen, Tübingen and Reutlingen |
| Germany | Zeus | 14 | Bamberg, Donaueschingen, Freiburg im Breisgau, Heidelberg / Leimen / Walldorf / Wiesloch, Konstanz, Ludwigsburg, Neustadt an der Weinstraße, Regensburg, Renningen, Schweinfurt, Singen, Tuttlingen, Villingen-Schwenningen and Würzburg |
| Germany | Yoio | 3 | Erfurt, Freiburg im Breisgau and Göttingen |
| Italy | Bird | 3 | Roma, Palermo and Napoli |
| Italy | Elerent | 1 | Catania |

German coverage contains 47 distinct cities, Italian coverage 4.
The complete reviewed city bounds, public discovery URLs and aliases are in
[`german-scooter-feeds.json`](../data/german-scooter-feeds.json) and
[`italian-scooter-feeds.json`](../data/italian-scooter-feeds.json).

## Data handling

- GBFS 2.2, 2.3 and 3.0 feeds are normalized using electric standing-scooter types.
  Bicycles, seated mopeds, reserved/disabled vehicles and invalid positions are excluded.
- Zeus's own feeds give its standing scooters the propulsion `electric_assist`,
  which GBFS keeps for pedal assistance; MobiData BW publishes the same scooters
  as `electric`. Only Zeus's `electric_assist` scooters are read as electric.
- Vehicle timestamps older than fifteen minutes are rejected; snapshot fallback
  never extends the fifteen-minute maximum age of individual scooter positions.
- GBFS discovery links must stay within the reviewed HTTPS city/feed base.
- German MobiData BW feeds use GBFS 3.0 and localized names. Multi-city feeds
  retain their published city subregions for provider filters and overview counts.
  Dott Heidelberg's zone reaches Leimen, so since 14 October 2026 its feed has
  a Leimen area too: Zeus's Leimen box, cut at the feed's own southern edge
  (49.3288–49.37 N, 8.62–8.73 E). Its 18 to 30 scooters there count under
  Leimen, not Heidelberg.
- A last sweep that evening checked every feed against six polls of 14 October
  2026 (00:01–00:10 and 13:09–13:20), each scooter placed in its municipality
  by BKG's boundaries ([VG250](https://gdz.bkg.bund.de/index.php/default/digitale-geodaten/verwaltungsgebiete.html)).
  A second town got an area where its scooters stand apart from the named
  city's and a box can hold them without taking in the city's; the box is the
  operator's zone in that town plus 1 km, stopping at the boundary on the
  side that faces the city, and centred on the town:
  - **Voi**'s Mannheim zone crosses the Rhine: 128 to 141 of its scooters stood
    in Ludwigshafen am Rhein and counted under Mannheim. Ludwigshafen am Rhein
    is now an area of Voi's feed, its part of the zone (west of the Rhine)
    plus 1 km on the other three sides (49.4287–49.5538 N, 8.3322–8.4587 E).
  - **Dott Heilbronn**: Weinsberg (17 to 19 scooters, 49.139–49.1781 N,
    9.2412–9.3173 E) and Untereisesheim (11 to 15, 49.2015–49.2246 N,
    9.1785–9.2168 E).
  - **Dott München**: Germering (13 or 14, 48.1047–48.1448 N,
    11.3336–11.3921 E).
  - **Yoio Göttingen**: Bovenden, a zone of its own 1 km north of Göttingen's,
    with 12 scooters in every poll; its area is that zone with the feed's own
    padding (51.5795–51.6057 N, 9.9159–9.9474 E).

  Each feed's first area keeps its old bounds and name, so no scooter left the
  map. In each poll at most 2 scooters of a town next door joined the new
  areas: Erlenbach's under Weinsberg, Neckarsulm's under Untereisesheim, all
  of which counted under Heilbronn before. Hanover, Tuebingen and Muenster now
  find Hannover, Tübingen and Münster.
- **Not given a town**: suburbs joined to the city, where a box would take in
  the city's own streets: Langenhagen (386 to 396 Dott scooters), Garbsen (114
  to 120) and Laatzen (90 to 104) under Hannover; Hattersheim am Main (86 or
  87 Lime scooters) under Frankfurt; Neckarsulm (50 to 55) under Heilbronn;
  Unterföhring (44 to 46), Gröbenzell (22 or 23) and Puchheim (16 or 17)
  under München; Tamm (11 to 21) and Asperg (9 to 11) under Zeus's
  Ludwigsburg. Dott München's 19 scooters at Munich Airport, in Freising,
  stand at its stations there and count under München too.
- Routing envelopes use published geofencing plus small padding.
  Hopp's global geofence is restricted to its reviewed Konstanz area.
  Bolt Karlsruhe's feed also lists no-parking zones in Pforzheim and Mannheim,
  so since 14 October 2026 its bounds are its two business areas, "BA Karlsruhe
  (Main/West)" and "BA Karlsruhe Ost", plus 1 km: 48.9703–49.0445 N,
  8.3087–8.4931 E. The old box, 48.8623–49.5247 N, 8.3074–8.7576 E, took in
  Heidelberg, Mannheim, Pforzheim, Leimen, Walldorf and Wiesloch. All 603
  scooters polled at 11:22 that day stood inside; a scooter seen at night in
  Ettlingen, 3.4 km south of the business areas, is left out.
  Zeus's zones are too coarse for this (one polygon of many rings, or zones
  tens of kilometres wide), so its bounds enclose the scooters' positions on
  11 October 2026, without those more than 6 km from the median, plus padding.
- Parking uses the existing virtual-bay, return-status and geofencing adapter.
  Empty or absent parking data does not imply unrestricted parking.
- Overview counts refresh hourly; individual scooters every twenty minutes, or
  every minute while someone looks at the town. City search recognizes
  local names and English aliases (for example München/Munich, Hannover/Hanover
  and Napoli/Naples).

## Yoio, October 2026

Yoio is a German operator, run by YourCar GmbH of Göttingen
([yoio.app](https://yoio.app/)), on ATOM Mobility's platform, as Hoppy and
Ride Mobility are. ATOM publishes its feeds as GBFS 3.0 at
`https://yoio.rideatom.com/gbfs/<id>/v3.0/gbfs`: 9 is Göttingen, 71 Freiburg
and 159 Erfurt. Every feed URL is https, on the discovery's origin and under its
directory.

- **Freiburg comes from MobiData BW**, whose `yoio_freiburg` feed republishes
  Yoio's own. In two paired polls it listed 234 and 238 available scooters
  where Yoio's listed 232 and 237, with the same vehicle ids (prefixed
  `YOO:Vehicle:`) and the same links, and its `last_updated` trailed Yoio's by
  about 35 seconds. MobiData BW's
  [bundled e-scooter dataset](https://mobidata-bw.de/dataset/escootch) is
  licensed under the
  [Datenlizenz Deutschland Namensnennung 2.0](https://www.govdata.de/dl-de/by-2-0),
  so it is read instead of Yoio's own feed. The map's credits already name
  MobiData BW.
- **Göttingen and Erfurt** come from Yoio's own feeds. They publish no licence:
  `system_information` has no `license_url`, and none was found on yoio.app.
- **Liveness:** ATOM stamps `last_updated` with the time of the request and
  gives no `last_reported`, so the feeds were judged by movement, polled
  six times, five minutes apart, from 18:29 to 18:54 on Tuesday 13 October
  2026, with each scooter followed by the number in its rental link.
  Göttingen listed 254 to 257 available scooters; between polls 4 left, 4 came
  back and 3 moved, one by more than 300 m. Freiburg, through MobiData BW,
  listed 234 to 238, with 18 leaving, 18 coming back and 5 moving; Erfurt
  183 to 185, with 8 leaving, 7 coming back and 4 moving.
- **Scooters:** every scooter type is `scooter_standing`, `electric`. Göttingen
  also lists e-bikes and cargo bikes (about 16), and Freiburg an e-bike type;
  the map leaves them out. Göttingen's one station, "E-Bikes: START & ENDE NUR
  HIER", is for its e-bikes.
- **Bounds** enclose the zones where Yoio lets a ride start (24 in Göttingen,
  19 in Freiburg, 14 in Erfurt), plus 0.005° of latitude and 0.01° of
  longitude. Every scooter seen stood inside them.
- **Prices** depend on the model and a tier: in Göttingen EUR 1.00 to start
  and EUR 0.21 or 0.25 a minute, in Freiburg EUR 1.09 and EUR 0.25 or 0.29, and
  in Erfurt EUR 1.09 and EUR 0.21 or 0.25.
- **Battery:** Yoio publishes range only (`current_range_meters`), so the map
  shows range and no percentage, as for Lime and Voi.
- **Rental links** (`https://rideyoio.app.link/<number>`) name each scooter by
  a short number, the same in every poll, not by a hardware id, so they are
  kept, on Yoio's own hosts only.
- **Burst limits:** ATOM refuses bursts of requests from one address, across
  all its operators. The scooter cache paces each `rideatom.com` host to one
  request every 500 ms, so the two Yoio feeds, Hoppy and Ride Mobility stay
  well below it.
- **Night rules:** all three feeds give opening hours of `24/7`. Freiburg's
  [page on rental e-scooters](https://www.freiburg.de/pb/2045706.html) names
  Yoio and Zeus and sets no-ride zones (pedestrian zones, parts of the old
  town, the villages west of the motorway) and parking rules, but no night
  ban. No rule banning rentals at night was found for Göttingen, which has a
  voluntary agreement with the operators and painted parking bays, or for
  Erfurt, where only the general special-use bylaw
  ([Sondernutzungssatzung](https://www.erfurt.de/mam/ef/rathaus/stadtrecht/6/6814.pdf))
  was found. No curfew was added.
- **Colour:** Yoio's mint green (#21d081) is too close to Bolt's and Beryl's
  greens, so the map uses a deep shade of it, #0d5e4a, with the initial Y.

## Voi in Böblingen and Sindelfingen, October 2026

The app already read Voi's Baden-Württemberg feed (`voi_de` on MobiData BW,
catalog id `voi_de_bw`) but dropped about 190 scooters in Böblingen and
Sindelfingen, because no area covered these towns. Two areas, one per town,
now route them, so each town can be searched by name; no new feed is read.

- **Zone:** Voi's operating zone "Stuttgart - New" in the feed's
  `geofencing_zones` has a separate part at 48.6634–48.7329 N,
  8.9579–9.0515 E, around Böblingen, Sindelfingen and Maichingen. Both areas
  span it, with about 0.005° of padding, and split at latitude 48.697. Of the
  209 scooters seen there, all but one stood on their own town's side of
  that line, as OpenStreetMap draws the boundary.
- **Liveness:** polled ten times, from 18:28 to 19:34 on Tuesday 13 October
  2026, about five minutes apart. The two towns listed 187 to 192 available
  scooters, about 105 in Sindelfingen and 85 in Böblingen; at 22:38 they still
  listed 189. Voi gives a scooter a new id after each ride, so rides show as
  ids leaving and new ids appearing: 22 left and 19 appeared, 14 of them more
  than 300 m from any scooter that left in the same interval.
- **Stuttgart:** the same zone's main part reaches 9.2806 E, east of the
  Stuttgart area's edge at 9.2723, and 2 scooters stood in between, so the
  edge moved to 9.29.
- **Licence:** MobiData BW's
  [bundled e-scooter dataset](https://mobidata-bw.de/dataset/escootch), under
  the [Datenlizenz Deutschland Namensnennung 2.0](https://www.govdata.de/dl-de/by-2-0);
  `system_information` has no `license_url`.
- **Scooters:** Voi publishes range only (`current_range_meters`), no battery
  percentage. Its rental links open Voi's app at the closest scooter, not at
  this one. The two towns' scooters use Voi's Stuttgart price: EUR 0.49 to
  start and EUR 0.24 a minute.
- **Night rules:** the feed gives opening hours of `24/7`, and no zone carries
  times. Böblingen's
  [voluntary commitment for operators](https://www.boeblingen.de/site/Boeblingen-Internet/get/params_E-497274273/25086993/Selbstverpflichtungserkl%C3%A4rung%20Stadt%20B%C3%B6blingen%20mit%20Anlagen.pdf)
  sets no-parking areas, groups of at most five scooters, at most 50 per
  operator in the town centre and a complaints service, but no night ban. No rule on shared scooters was found for
  Sindelfingen. No curfew was added.

## Zeus's move to ATOM Mobility, October 2026

Zeus is moving its towns from its own backend, whose GBFS 2.2 feeds are at
`zeus.city`, to ATOM Mobility's platform, which publishes GBFS 3.0 at
`https://zeus.rideatom.com/gbfs/<id>/v3.0/gbfs`. A town that has moved keeps
its `zeus.city` feed, but every scooter in it is disabled and none moves. On
13 October 2026 Zeus's `zeus.city` and MobiData BW feeds were polled five
times, five minutes apart, from 19:12 to 19:34, after the polls from 18:28.
Zeus's ATOM ids were mapped from 19:09 to 19:16 and rechecked at 22:35, never
faster than one request a second. Every ATOM feed is keyless, on the
discovery's origin and under its directory, and publishes no `license_url`.

- **Nothing on the map changes.** Each ATOM id with scooters is one that
  MobiData BW already republishes, with the same vehicle ids, and the map
  reads MobiData BW, which licenses them:

  | ATOM id | ATOM's name | MobiData BW feed | Available |
  | --- | --- | --- | ---: |
  | 185 | Heidelberg | `zeus_leimen_walldorf_wiesloch` | 111 |
  | 188 | Konstanz | `zeus_konstanz` | 110 |
  | 190 | Neustadt | `zeus_neustadt` | 140 |
  | 1339 | Singen | `zeus_singen` | 269 |
  | 1396 | Renningen Malmsheim 2 | `zeus_renningen_malmsheim` | 85 |
  | 1412 | Donaueschingen 2 | `zeus_donaueschingen` | 121 |
  | 1415 | Würzburg 2 | `zeus_wurzburg` | 183 |
  | 1416 | Tuttlingen 2 | `zeus_tuttlingen` | 110 |
  | 1417 | Freiburg 2 | `zeus_freiburg` | 278 |
  | 1421 | Villingen Schwenningen 2 | `zeus_villingen_schwenningen` | 284 |

- **The four towns read from `zeus.city` are still live:** Bamberg (89 to 91
  available), Ludwigsburg (141 or 142), Regensburg (195 to 197) and
  Schweinfurt (154 or 155), with scooters leaving and arriving between polls.
  Their ATOM ids answer but list no vehicles: 184 ("Bamberg/Memmelsdorf"), 82
  (Ludwigsburg, which MobiData BW's empty `zeus_ludwigsburg` mirrors), 192
  (Regensburg) and 193 (Schweinfurt). When one of these `zeus.city` feeds lists
  only disabled scooters, read the town from its ATOM id instead, or from
  MobiData BW if it carries the town.
- **Moved, with no feed to read:** `zeus.city` lists only disabled scooters,
  the same in all five polls, in Rüsselsheim (131), Straubing (109), Kempten
  (105), Pforzheim (87), Göppingen (56), Schwäbisch Gmünd (55), Tübingen (51),
  Hagen (44), Hattingen (35) and Heilbronn (15). It does the same for Konstanz
  (104) and Villingen-Schwenningen (354), which the map reads from MobiData BW.
  The ATOM ids named Kempten (187), Pforzheim (191) and Heilbronn (186) list
  no vehicles, and 26 Zeus ids answer "GBFS disabled": 194, 1301, 1303, 1318,
  1330 to 1337, 1386, 1387, 1391, 1392, 1394, 1395, 1397, 1398, 1404, 1411,
  1413, 1414 and 1418 to 1420. A disabled id gives no name, so which towns
  they hold is unknown. Voi still covers Pforzheim and Tübingen.
- **No feed at all:** Zeus's list of cities also names Haßloch, Iserlohn,
  Falkensee, Dessau-Roßlau, Korntal-Münchingen, Eisenach, Gotha, Jülich,
  Wangen, Schwieberdingen, Sonthofen, Soest and Rottweil, which have neither a
  `zeus.city` feed nor a known ATOM id.
- **Depots:** ATOM id 189, "Zeus Warehouse (Neustadt)", is empty and is not a
  town. MobiData BW's Konstanz feed lists 9 scooters stacked at one point in
  Singen, and Zeus's Ludwigsburg feed 8 at one point east of the town; both
  stacks lie outside their town's bounds, so the map leaves them out. The
  Ludwigsburg stack stands at one building in Poppenweiler (48.9088° N,
  9.2645° E), 2.6 km east of the end of Zeus's ride zone and outside every
  zone its feed publishes: the same 9 scooters in four polls on the night of
  15 to 16 October 2026, 7 or 8 of them available, none moved. The bounds
  are right to leave it out.
- **Request rate:** ATOM blocks an address after a burst of about 900
  requests, across its operators. The scooter cache reads no Zeus feed from
  ATOM. Each ATOM feed is asked for its `vehicle_status`, and its
  `station_status` where it has parking, every 20 minutes, or every minute
  for 10 minutes after someone looks at its town, and for five metadata
  documents an hour: 8 to 11 requests an hour while nobody looks, and at most
  65 to 125 while someone does. Yoio's two towns cost about 20 an hour on
  `yoio.rideatom.com`, at most about 250 with both watched, and each
  `rideatom.com` host is paced to one request every 500 ms. Ten Zeus towns
  read from ATOM directly would add 80 to 110 an hour on `zeus.rideatom.com`,
  and up to 650 to 1,250 with all of them watched. For every ATOM feed the
  cache reads, see [ATOM's request rate](#atoms-request-rate-october-2026).

## Italy, October 2026

Bird Palermo and Bird Napoli are Bird's own GBFS 2.3 feeds, under the
`palermo-italy` and `napoli-italy` slugs of `mds.bird.co`; the plain `palermo`
and `napoli` slugs answer 404. On 13 October 2026, after midnight Rome time,
each was polled four times, five minutes apart. Palermo listed 1,226 to 1,231
scooters, 1,214 to 1,219 of them available, and Napoli 542 or 543, with 508 or
509 available. Every poll was under a minute old. Between polls, about 450 of
Palermo's positions changed and about 40 of Napoli's, and Bird rotated every
vehicle id, as it does elsewhere. Every feed URL is https, on the discovery's
origin and under its directory.

- **Bounds** enclose every zone where Bird's geofencing allows riding, plus
  0.005° of padding. Palermo publishes 33 zones and Napoli 97, most of them
  no-ride or no-parking zones. Napoli's riding zones include three detached
  ones east and west of the city, where no scooter stood during the polls.
- **Battery** is published for every scooter. There are no rental links, so a
  scooter's card opens Bird's app, and the pricing list is empty, so no ride
  estimate is shown, as for Bird in Portugal and Spain.
- **Licence:** the `license_url` is Bird's 2018 PDF, which answers 404, as in
  the [Portuguese and Spanish audit](portuguese-spanish-icelandic-scooter-feeds.md#licences).
- **Palermo's permits:** the city's final ranking
  ([Determinazione Dirigenziale n. 1874 of 5 February 2025](https://www.comune.palermo.it/wp-content/uploads/2025/02/25a49427-438b-45df-b3bb-483410e652aa.pdf))
  authorises Link your city Italia, Emtransit (Dott) and Lime for five years,
  and gave the other operators 20 days to stop. Bird is not among them, yet its
  feed lists about 1,220 scooters. Bird's other `-italy` slugs (Collegno, Moncalieri,
  Nichelino, Rivoli, Sesto Fiorentino) are former Link towns, so these may be
  Link's fleets, now run by Bird. That is not confirmed.
- **Rome's permits** ran from 1 September 2023 to 31 August 2026. D.D. QG
  1649/2026 extends them for the time a new selection needs; the press gives
  31 October 2026, the day Rome's bike-sharing permits end. Applications close
  on 26 October 2026 at 15:00; the selection picks up to three scooter
  operators, for three years, who then have 150 days to start
  ([Roma Servizi per la Mobilità](https://romamobilita.it/eventi-e-news/selezione-operatori-servizi-di-micromobilita-sharing/)).
- **City rules:** Firenze banned shared scooters from 1 April 2026
  ([Comune di Firenze](https://www.comune.firenze.it/novita/comunicati/sharing-mobility-dal-1deg-aprile-stop-ai-monopattini-sharing)).
  Milano revoked Bird's permit in July 2026, over scooters without the plates
  required since 17 May 2026. BIT's service in Prato ended on 31 December 2025.
  No Italian city was found to ban renting at night.

## Elerent in Catania, October 2026

Elerent is a Sicilian operator from Ragusa ([elerent.it](https://www.elerent.it/)),
on ATOM Mobility's platform, as Hoppy, Ride Mobility and Yoio are. Its Catania
feed is keyless GBFS 3.0 at `https://elerent.rideatom.com/gbfs/2166/v3.0/gbfs`,
and every feed URL is https, on the discovery's origin and under its
directory. Catania awarded its new scooter permits to Bolt (400 scooters), Lime
(300) and Elerent Ragusa (300), after Bit Mobility, ranked first, withdrew
([Mobilita Catania, 16 February 2026](https://catania.mobilita.org/2026/02/16/catania-punta-ancora-sui-monopattini-in-sharing-in-arrivo-mille-mezzi-e-nuove-regole-piu-rigide/)).
Bolt and Lime publish no Italian feed.

- **Liveness:** ATOM stamps `last_updated` with the time of the request and
  gives no `last_reported`, and a scooter's `vehicle_id` changes after each
  ride, so each scooter was followed by the code at the end of its rental link,
  such as `CAT0059`, which is printed on it. The feed was polled 153 times,
  every five minutes, from 23:00 on Tuesday 13 October to 10:28 the next
  morning, and listed 125 to 137 available scooters. It had 30 rides, 18 of
  them at night, by 25 scooters: each came back 0.2 to 2.4 km away under a new
  id, after 5 to 75 minutes, with 1 to 31 points less charge.
- **Scooters:** both vehicle types (`ZIMO CAT` and `MAX PLUS CAT`) are
  `scooter_standing`, `electric`.
- **Bounds:** ATOM's geofencing forbids starting or ending a ride everywhere
  (`global_rules`), and allows both in 8 zones: four large ones over central
  Catania and four small ones around it. The bounds enclose them, plus
  0.005° of latitude and 0.01° of longitude; every scooter seen stood inside.
  Catane is an alias.
- **Battery:** ATOM gives each scooter its type's maximum range scaled by its
  charge, and Elerent sets that maximum to 1,000 km (`max_range_meters`
  1,000,000; the plans say "Maximum distance is 1000.00"). So its
  `current_range_meters`, 120,000 to 930,000, is the charge: 650,000 is 65%.
  The parser reads any range over 200 km, against a type maximum that large, as
  a charge, and shows it as a battery level with no range. Hoppy's 60 km
  maximum gives real ranges, which it keeps.
- **Prices:** EUR 1.00 to start and EUR 0.26 a minute, for both types.
- **Rental links** (`https://elerent.app.link/<code>`) name each scooter by the
  code it carries, not by a hardware id, so they are kept, on Elerent's own
  hosts only.
- **Licence:** none. The feed has no `license_url`, and an empty
  `feed_contact_email`.
- **Night rules:** the feed gives opening hours of `24/7`. Catania's new rules
  bring helmets, plates and fines for scooters left outside the parking bays,
  but no reports of them name a night ban. No curfew was added.
- **Colour:** Elerent's brand lime (#bbd033) on black is too light for the
  map's white initials, so the map uses a deep olive shade of it, #6e7d18,
  with the initial E. No other provider uses E.
- **Left out:** Elerent's Bologna feed (id 1887) listed one scooter, with
  e-bikes and petrol mopeds. Elerent also runs in Ragusa and Siracusa, with no
  public feed found.

## ATOM's request rate, October 2026

With Elerent's Catania, Hoppy's Oostende, Mechelen, Sint-Niklaas and
Blankenberge, its Rhodes, Kos, Rethymno and Zakynthos, and its six Spanish
systems (Puerto del Carmen, Tenerife Sur, Corralejo, Caleta de Fuste, Marina
Baixa and Torrevieja), the scooter cache reads 20 ATOM feeds: 16 of Hoppy's on
`hoppy.rideatom.com` (with Kortrijk and Rijeka), Yoio's two, Ride Mobility's
Rīga and Elerent's Catania. None of Hoppy's or Elerent's has stations, so each
feed costs one `vehicle_status` a collection, plus five metadata documents an
hour: discovery, vehicle types, prices, stations and geofencing.

- **Now,** the cache collects the feeds outside Switzerland that nobody looks
  at every twenty minutes, so a feed costs about 8 requests an hour:
  `hoppy.rideatom.com` carries about 130 an hour, and ATOM's four hosts about
  170, as Yoio's and Ride Mobility's feeds also read their parking. A feed
  someone looks at is collected every minute for ten minutes, so it costs up
  to 65 an hour while watched: each Hoppy town watched for a whole hour adds
  about 57 to Hoppy's host, which would reach a few hundred an hour with five
  towns watched at once, and about 1,040 only if all sixteen were.
- **Before 14 October 2026,** the cache collected every feed every minute, at
  about 65 requests an hour each: `hoppy.rideatom.com` would have carried
  about 1,040 an hour, one every three or four seconds, and ATOM's hosts about
  1,500.

The cache paces each `rideatom.com` host to one request every 500 ms and
spreads the feeds over the interval, so ATOM sees a steady trickle, never a
burst like the roughly 900 quick requests after which it blocked a scanning
address. With the twenty-minute cadence Hoppy's host stays near 130 requests
an hour, so no interval was changed for ATOM.

## Known gaps

- Dott no longer publishes most German regions, among them Hamburg, Bremen,
  Nürnberg, Dortmund and Karlsruhe (where Bolt and Voi remain). Dott documents
  its authenticated feed among its partner integrations.
- Dott's 21 Italian city endpoints returned 404 (`ERR_REGION_NOT_FOUND`), and
  Catania and Alghero 403 (`ERR_REGION_OFFLINE`); the Italy country index
  contained no city feeds, and Dott's API now needs authentication. Dott still
  runs in Roma, Milano, Palermo and other cities.
- Lime's Italian endpoints all returned 404, though Lime runs in Roma, Milano
  and Palermo.
- Bird Milano, Firenze, Torino, Moncalieri, Collegno, Rivoli, Nichelino and
  Sesto Fiorentino were empty, with a timestamp of 0, and so were Bird München
  and Ulm on 16 October 2026. Bird left Ulm and Neu-Ulm around 2022
  ([Schwäbische Zeitung](https://www.schwaebische.de/regional/ulm-alb-donau/ulm/e-scooter-ernten-lob-und-enttaeuschung-50855)).
  None was added.
- Elerent Bologna (ATOM id 1887) listed one scooter on 13 October 2026; left
  out.
- Hopp Como held no scooters at night on 13 October 2026, nor in 22 polls from
  18:26 to 19:50 that evening; check it in spring.
- Hopp Augsburg (`de-augsburg`) listed 42 scooters, all disabled, in each of
  22 polls from 18:26 to 19:50 on 13 October 2026, with the same ids and
  charge throughout. Hopp's site still lists the town; check it in spring.
- RideMovi's feeds answer 401, and BIT Mobility (Napoli, Bari and others)
  shows its scooters only after a login. Helbiz's and Link's hosts no longer
  resolve. Cooltra lists mopeds and e-bikes, no scooters. Pony's site lists
  Turin, but its server answered `UNKNOWN_REGION` for Turin and Torino.
- Zeus's own feeds for Castrop-Rauxel, Duisburg, Friedberg, Gera, Herne, Jena,
  Marburg and Reutlingen held no available scooters, and Limburgerhof a few;
  none was added. Ten more towns list only disabled scooters since Zeus moved
  them to ATOM Mobility, which publishes no feed with scooters for them; see
  [Zeus's move to ATOM Mobility](#zeuss-move-to-atom-mobility-october-2026).
  Its Italian feeds were
  stale or empty: Anzio, Augusta and Mazara listed no available scooter, and
  Teramo, Modena and Reggio Emilia none at all.
- German Lime Dresden and Oberhausen contained no available standing scooters;
  the Hamburg and older Stuttgart discovery URLs returned 404.
- Voi's reviewed German proxy covers eight cities in Baden-Württemberg; it is
  not a nationwide Voi feed. Other operator/city combinations remain unverified.
- Outside Baden-Württemberg, the operators' feeds reach regional hubs but not
  the public, as checked on 16 October 2026:
  - North Rhine-Westphalia's
    [Multimodale Datendrehscheibe](https://mdd.gorheinland.com/) carries GBFS
    for Bolt (Köln/Bonn, Düsseldorf, Essen, Dortmund, Münster,
    Bielefeld/Paderborn and Herford), Voi (eleven towns), Lime, Dott and Ryde.
    Only transport bodies and municipalities may use it, and requests without
    an account answer 401.
  - Hamburg and Dresden receive the operators' MDS data for the city only.
  - On Mobilithek, Voi publishes static NeTEx (zones, parking spots and fares)
    for 22 German cities, but no vehicles. The only live scooter offer there
    is Karlsruhe's, which the map already reads through MobiData BW.

## Sources and recheck

[MobiData BW](https://www.mobidata-bw.de/) provides the public regional proxy feeds.
Zeus publishes its own city feeds at `https://zeus.city/api/v1/mds/gbfs/<city>/gbfs.json`,
and on ATOM Mobility at `https://zeus.rideatom.com/gbfs/<id>/v3.0/gbfs`.
Yoio publishes its own feeds on ATOM Mobility, at `https://yoio.rideatom.com/gbfs/<id>/v3.0/gbfs`,
and Elerent its Catania feed, at `https://elerent.rideatom.com/gbfs/2166/v3.0/gbfs`.
[Dott Germany discovery](https://gbfs.api.ridedott.com/public/v2/countries/de/gbfs.json)
contains repeated feed names for separate cities, so each reviewed city is collected
independently. Bird's own feeds for
[Roma](https://mds.bird.co/gbfs/v2/public/rome/gbfs.json),
[Palermo](https://mds.bird.co/gbfs/v2/public/palermo-italy/gbfs.json) and
[Napoli](https://mds.bird.co/gbfs/v2/public/napoli-italy/gbfs.json) supply
the enabled Italian services. Operator attribution is retained in the map and API.
Existing operator data terms continue to apply; public access does not replace them.

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=FR,DE,IT --json
SCOOTRADAR_BASE_URL=http://127.0.0.1:3001 node scripts/check-map-performance.mjs
```

The checker compares the catalog with Dott's listing of each country, and the
[catalog check workflow](../.github/workflows/catalog-check.yml) runs it every
Monday. It fails when an entry is gone; see the
[French recheck notes](french-scooter-feeds.md#recheck).
