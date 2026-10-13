# French scooter feed investigation

Verified on **8 September 2026** (Europe/Zurich). Public GBFS feeds were sufficient;
no mobile-app reverse engineering, account login, or private API credentials were
needed for the integrated systems.

The initial survey checked 51 French systems from the
[MobilityData GBFS catalog](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
and cross-checked the [French National Access Point](https://transport.data.gouv.fr/datasets?format=gbfs&subtype=scooter).
27 feeds returned available electric standing scooters, covering 25 distinct
cities or operating areas. The repository now includes those feeds in
[`data/french-scooter-feeds.json`](../data/french-scooter-feeds.json).

Rechecked 13 October 2026: Pony La Roche-sur-Yon joined the catalog, read with the key the National Access Point publishes for La
Roche-sur-Yon; see [Pony, October 2026](#pony-october-2026). Lime west of Paris
and Bird Agen joined it the same day; see
[Lime west of Paris and Bird Agen, October 2026](#lime-west-of-paris-and-bird-agen-october-2026).
So did Naolib Micromob' in Nantes and Saint-Herblain, a provider of its own read
from Pony's feed; see [Naolib Micromob', October 2026](#naolib-micromob-october-2026).

## Verified availability

This is a snapshot, not a fleet-size promise. Counts below exclude reserved or
disabled vehicles, bicycles, mopeds, missing coordinates, and vehicles outside
the reviewed service-area envelopes. Snapshot: `2026-09-07T23:39:04.510Z`.

| Operator | Working feeds | Available scooters | Battery percentage | Range | Rental links |
| --- | ---: | ---: | --- | --- | --- |
| Bird | 5 | 800 | Yes | Yes | Not supplied |
| Dott | 6 | 4,973 | Yes | Yes | Yes |
| Lime | 2 | 2,418 | Not supplied | Yes | Not supplied |
| Pony | 9 | 2,506 | Yes | Yes | Yes |
| Voi | 5 | 4,565 | Not supplied | Yes | Yes |

Total: **15,262 available scooters**, with **0 failed feeds** in the final catalog check.

| Operator | City / operating area | Available scooters | Public GBFS discovery |
| --- | --- | ---: | --- |
| Bird | Ajaccio | 195 | [Discovery](https://mds.bird.co/gbfs/v2/public/ajaccio/gbfs.json) |
| Bird | Blois | 205 | [Discovery](https://mds.bird.co/gbfs/v2/public/provider/bird/blois-france/gbfs.json) |
| Bird | Châlons-en-Champagne | 95 | [Discovery](https://mds.bird.co/gbfs/v2/public/chalonsenchampagne/gbfs.json) |
| Bird | Laval | 237 | [Discovery](https://mds.bird.co/gbfs/v2/public/laval/gbfs.json) |
| Bird | Vichy | 68 | [Discovery](https://mds.bird.co/gbfs/v2/public/vichy/gbfs.json) |
| Dott | Bordeaux | 933 | [Discovery](https://gbfs.api.ridedott.com/public/v2/bordeaux/gbfs.json) |
| Dott | Bourgoin-Jallieu | 143 | [Discovery](https://gbfs.api.ridedott.com/public/v2/bourgoin-jallieu/gbfs.json) |
| Dott | Lyon | 3,514 | [Discovery](https://gbfs.api.ridedott.com/public/v2/lyon/gbfs.json) |
| Dott | Marne-la-Vallée (SIEMU) | 238 | [Discovery](https://gbfs.api.ridedott.com/public/v2/siemu/gbfs.json) |
| Dott | Tignes | 30 | [Discovery](https://gbfs.api.ridedott.com/public/v2/tignes/gbfs.json) |
| Dott | Versailles Grand Parc | 115 | [Discovery](https://gbfs.api.ridedott.com/public/v2/versailles-grand-parc/gbfs.json) |
| Lime | Lille Métropole | 1,089 | [Discovery](https://data.lime.bike/api/partners/v2/gbfs/lille/gbfs.json) |
| Lime | Marseille | 1,329 | [Discovery](https://data.lime.bike/api/partners/v2/gbfs/marseille/gbfs.json) |
| Pony | Angers | 601 | [Discovery](https://proxy.transport.data.gouv.fr/resource/pony-angers-gbfs/gbfs.json) |
| Pony | Beauvais | 39 | [Discovery](https://proxy.transport.data.gouv.fr/resource/pony-beauvais-gbfs/gbfs.json) |
| Pony | Bordeaux | 880 | [Discovery](https://proxy.transport.data.gouv.fr/resource/pony-bordeaux-gbfs/gbfs.json) |
| Pony | Bourges | 152 | [Discovery](https://proxy.transport.data.gouv.fr/resource/pony-bourges-gbfs/gbfs.json) |
| Pony | Évry-Courcouronnes | 113 | [Discovery](https://proxy.transport.data.gouv.fr/resource/pony-evry-gbfs/gbfs.json) |
| Pony | Hérouville-Saint-Clair | 24 | [Discovery](https://proxy.transport.data.gouv.fr/resource/pony-herouville-gbfs/gbfs.json) |
| Pony | Lorient | 101 | [Discovery](https://proxy.transport.data.gouv.fr/resource/pony-lorient-gbfs/gbfs.json) |
| Pony | Perpignan | 402 | [Discovery](https://proxy.transport.data.gouv.fr/resource/pony-perpignan-gbfs/gbfs.json) |
| Pony | Poitiers | 194 | [Discovery](https://proxy.transport.data.gouv.fr/resource/pony-poitiers-gbfs/gbfs.json) |
| Voi | Le Havre | 898 | [Discovery](https://api.voiapp.io/gbfs/fr/6bb6b5dc-1cda-4da7-9216-d3023a0bc54a/v2/336/gbfs.json) |
| Voi | Saint-Quentin-en-Yvelines | 658 | [Discovery](https://api.voiapp.io/gbfs/fr/6bb6b5dc-1cda-4da7-9216-d3023a0bc54a/v2/355/gbfs.json) |
| Voi | Grenoble | 1,154 | [Discovery](https://api.voiapp.io/gbfs/fr/6bb6b5dc-1cda-4da7-9216-d3023a0bc54a/v2/358/gbfs.json) |
| Voi | Grand Paris Seine et Oise | 550 | [Discovery](https://api.voiapp.io/gbfs/fr/6bb6b5dc-1cda-4da7-9216-d3023a0bc54a/v2/422/gbfs.json) |
| Voi | Marseille | 1,305 | [Discovery](https://api.voiapp.io/gbfs/fr/6bb6b5dc-1cda-4da7-9216-d3023a0bc54a/v2/66/gbfs.json) |

## Pony, October 2026

La Roche-sur-Yon Agglomération publishes its Pony scooters on
transport.data.gouv.fr, in the dataset
[Trottinettes Pony La Roche-sur-Yon](https://transport.data.gouv.fr/datasets/stations-trottinette-en-libre-service-de-la-roche-sur-yon),
under the [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
Its one resource links Pony's own GBFS 2.2 feed, with the key the address
needs: `https://gbfs.getapony.com/v1/La_Roche_Sur_Yon/en/gbfs.json?key=…`.
Without the key the feed answers 401. The access point has no proxy for this
town, unlike Pony's other French towns, so the catalog uses that address, key
included, as the Belgian catalog does for Charleroi. Every feed URL the
discovery lists is https, on its origin and under its directory, with the key.

**The key and Pony's other towns.** The key was published for La Roche-sur-Yon
only, but Pony's server accepted it for each of its regions tried. It was
decided on 13 October 2026 that the map may use it for Pony's other towns too.
Of the others tried, only Nantes qualifies, for the scooters of Naolib
Micromob' (see below). No other key is committed: the proxy hides the key of
Pony's other French towns, and the Belgian access point publishes Charleroi's.

| Town | Available scooters | Polls | Movement between polls |
| --- | ---: | --- | --- |
| La Roche-sur-Yon | 83–88 | 6, five minutes apart, 18:29–18:54 on Tuesday 13 October 2026 | 11 left their spot, 14 appeared at a new one, 16 batteries changed |

- **La Roche-sur-Yon:** Pony gives each scooter a new `bike_id` on every
  request and stamps `last_reported` with the time of the request, so
  scooters were followed by position and battery. A scooter being ridden
  leaves the feed. Riders must end their ride at one of Pony's 82 virtual
  stations; about 80 scooters stood at one, and 7 or 8 elsewhere in the zone. The
  bounds are Pony's operating zone plus 0.005° of latitude and 0.01° of
  longitude; every scooter seen stood inside. A ride costs EUR 1.00 and
  EUR 0.23 a minute; battery and range are published, and the rental link
  opens Pony's scanner, as elsewhere. Neither the feed's zones nor the
  agglomeration's
  [September 2024 press kit](https://larochesuryon.fr/app/uploads/2024/09/DP_Nouveaux_Services_Mobilites_Transport_Sept2024.pdf)
  (150 scooters, 75 stations then) set hours, and no night ban was found.
- **Nantes:** Pony's Nantes region lists the scooters of Naolib Micromob',
  which riders rent in Naolib's app at Naolib's price. The map shows them as
  Naolib Micromob's, without Pony's price or app; see
  [Naolib Micromob', October 2026](#naolib-micromob-october-2026).
- **Other regions, with the same key:** Liège listed 8 or 9 available
  scooters, most of which never moved, so it stays out (see the
  [Belgian audit](belgian-norwegian-british-scooter-feeds.md#known-gaps)).
  Brussels listed 4 scooters and Paris 9, all disabled. Tours, Orléans,
  Limoges, Nice and Marseille listed e-bikes only, and Pays Basque
  (`Basque_Country`) e-bikes and one disabled scooter. Caen, Olivet, Sète and
  Turin (also as Torino), which Pony's site lists, answered `UNKNOWN_REGION`
  under every name tried. Angers, Beauvais, Bordeaux, Bourges, Évry,
  Hérouville, Lorient, Perpignan and Poitiers answer too, but the map already
  reads them through the access point's proxy.

## Naolib Micromob', October 2026

Naolib Micromob' is the scooter and e-bike service of Nantes Métropole's Naolib
network, at Chantrerie, in the north-east of Nantes, and in Saint-Herblain: 60
scooters and 35 e-bikes at 16 stations, 8 at each site
([Naolib](https://naolib.fr/fr/velos/micromob-1);
[Nantes Métropole](https://metropole.nantes.fr/actualites/pour-le-dernier-kilometre-deplacez-vous-avec-naolib-micromob),
updated 31 March 2025). Its scooters are Pony's, and Pony's Nantes region lists
them, read with the key La Roche-sur-Yon Agglomération publishes (see
[Pony, October 2026](#pony-october-2026)):
`https://gbfs.getapony.com/v1/Nantes/en/gbfs.json?key=…`, GBFS 2.2. Every feed
its discovery lists is https, on its origin and under its directory.

| Town | Available scooters | Polls | Movement between polls |
| --- | ---: | --- | --- |
| Nantes (Chantrerie) | 23–24 | 20, five minutes apart, 18:29–20:04, and 5 more, 23:18–23:38, on Tuesday 13 October 2026 | 2 available scooters ridden from one station to another, Chantrerie Grandes Écoles to École Vétérinaire (18:39–18:49) and Ponton Gachet to Sophie Germain (19:44–19:54); a disabled one moved too |
| Saint-Herblain | 23–24 | the same | 1 ridden 1 km, François Mitterrand to Rivaudière (18:59–19:04) |

- **A provider of its own.** Riders rent these scooters in the Naolib Micromob'
  app or at [micromob.naolib.fr](https://micromob.naolib.fr/), not in Pony's
  app, so the map shows them as Naolib Micromob' (`naolib`, initials NM),
  never as Pony's. Its colour, #60a400, is a deeper shade of Naolib's green,
  #78d700, which sits too close to Lime's and Bolt's and is too light for
  white initials. The catalog entry, `naolib_fr_nantes`, names Pony as the
  `feedOperator`.
- **No price.** Pony's feed prices them at Pony's fare, EUR 1.00 and EUR 0.22 a
  minute. Naolib charges EUR 0.10 a minute; with a subscription, EUR 1 a month
  or free with a Naolib card, the first 15 minutes of each ride are free
  ([Naolib](https://naolib.fr/fr/velos/micromob-1)). The map reads no price
  from another operator's feed, and it has no way to carry a fixed price per
  provider, so it shows none.
- **No link.** Pony's feed links each scooter to Pony's scanner
  (`https://getapony.com/app/scan`), which can't rent them. Links are kept only
  on their provider's own hosts, and Naolib Micromob' has none listed, so its
  scooters have no "Open in" button on the web or on iOS. The app has no link
  per provider to fall back on: since 12 October 2026, iOS only tries a
  scooter's next link when one fails. The city's feed links every vehicle to
  `https://micromob.naolib.fr//#/trip/start`, which a link per provider could
  use one day.
- **The feed.** Pony gives each scooter a new `bike_id` on every request and
  stamps `last_reported` with the time of the request, as in La Roche-sur-Yon,
  so rides were traced by `_vehicle_id`, Pony's own code for each scooter,
  which stays the same. A scooter being ridden stays in the feed as available,
  unlocked, so the map may show one for the length of a ride. Battery and range
  are published; the feed's two e-bikes, both disabled, are left out, and
  Naolib's 35 e-bikes are not in it.
- **Bounds.** Rides end at a station, and every available scooter stood at one.
  Each town's area is its 8 stations plus 0.006° of latitude and 0.009° of
  longitude; the zones of Pony's feed and of the city's cover the whole
  metropole. Pony's feed lists 51 stations: each of Naolib's 16 twice, once
  with "NFC" in its name, 18 in the centre of Nantes that held no scooter, and
  a test station. One available scooter stood still in the west of central
  Nantes, away from any station, in all 25 polls; the areas leave it out.
- **No night ban.** The city's feed gives `opening_hours` as `24/7`, and
  neither Naolib nor Nantes Métropole sets hours.
- **Licence.** Pony's feed publishes none; the key comes from La
  Roche-sur-Yon's dataset, under the Licence Ouverte 2.0. Nantes Métropole
  publishes the same fleet under the Licence Ouverte in its
  [Naolib Micromob' dataset](https://transport.data.gouv.fr/datasets/offre-et-temps-reel-du-service-naolib-micromob-de-nantes-metropole-au-format-gbfs),
  but its discovery, on `api.gbfs.ecovelo.mobi`, lists its feeds on another
  host, `api.gbfs.v3.0.ecovelo.mobi`, and its vehicle types outside its
  directory, so it fails the same-origin rule. Its positions match Pony's: at
  23:20, 47 of Pony's 49 available scooters stood within 30 m of one the city's
  feed lists as available. The city's feed also lists as available seven
  scooters at 0% battery, which Pony's marks disabled.

## Lime west of Paris and Bird Agen, October 2026

Both feeds are keyless GBFS over https, and every feed their discoveries list
is on the discovery's origin and under its directory.

| Feed | Available scooters | Polls | Movement between polls |
| --- | ---: | --- | --- |
| Lime, Saint-Germain Boucles de Seine ([discovery](https://data.lime.bike/api/partners/v2/gbfs/paris_west/gbfs.json), GBFS 2.2) | 487–498 | 5, five minutes apart, 19:05–19:25 on Tuesday 13 October 2026 | 6 followed by id moved 190 m to 1 km; by position, 3 to 19 left their spot and 6 to 14 appeared at a new one in each interval |
| Bird Agen ([discovery](https://mds.bird.co/gbfs/v2/public/agen-france/gbfs.json), GBFS 2.3) | 141–144 | the same five polls | by position, 1 to 3 left their spot and up to 3 appeared at a new one in each interval; 5 left and 5 appeared between the first and last |

- **Lime west of Paris** (`paris_west`) is listed only on data.gouv.fr, where
  Lime itself publishes it as [GBFS CASGBS](https://www.data.gouv.fr/datasets/gbfs-casgbs)
  under the Licence Ouverte 2.0; the feed's own `license_url` points to Lime's
  GBFS terms. It is the service of the Communauté d'agglomération Saint Germain Boucles de Seine,
  which Lime took over from Dott at the end of July 2025
  ([Infos Yvelines](https://www.infosyvelines.fr/articles/15-communes-des-yvelines-sunissent-pour-la-mobilite-douce),
  updated 9 August 2026). Scooters run in eight towns: Croissy-sur-Seine,
  Houilles, Le Pecq, Le Port-Marly, Le Vésinet, Marly-le-Roi, Montesson and
  Sartrouville; Bezons, Carrières-sur-Seine, Chambourcy, Chatou,
  L'Étang-la-Ville, Louveciennes and Mareil-Marly have e-bikes only. The feed
  lists about 495 scooters (type 2) and about 525 e-bikes, which the map leaves
  out. The catalog entry has one area per town, so each can be searched and
  counted; each area is the town's boundary
  ([geo.api.gouv.fr](https://geo.api.gouv.fr/epcis/200058519/communes)) plus
  0.003° of latitude and 0.004° of longitude, as the feed has no geofencing.
  In the first poll Houilles held 147 scooters, Marly-le-Roi 83, Montesson 63,
  Le Pecq 55, Croissy 51, Le Vésinet 48, Le Port-Marly 17 and Sartrouville 7,
  all at its southern edge. About 20 scooters stood still through the five polls
  west of the service, around Saint-Nom-la-Bretèche, with one in Bougival; they fall
  outside the areas and the map leaves them out. Lime gives a scooter the same
  `bike_id` for a few polls, then a new one, and stamps `last_reported` with
  the time of the request. Range is published, battery and rental links are
  not, and the feed has no pricing; the article gives EUR 1 and EUR 0.22 a
  minute. Its one station, `paris_west`, is a placeholder about 35 km north-west
  of the towns, not a parking spot; the map shows no parking for it. Rides end at
  authorised spots, checked by a photo. The article says the vehicles stay
  available day and night, every day, so there is no night ban. Dott has no
  feed here any more, and the catalog never had one.
- **Bird Agen:** the [city](https://www.agen.fr/vie-quotidienne/se-deplacer-et-stationner/trottinettes-electriques-en-libre-service-a-agen)
  (updated 17 August 2026) lists 150 scooters, renewed in April 2025, at 58
  parking spots, at EUR 1 and EUR 0.20 a minute, for riders 18 or older. The
  feed has 56 virtual stations and gives battery and range, but no rental
  links and an empty pricing plan list. Bird gives each scooter a new
  `bike_id` on every request, so scooters were followed by position. One
  scooter's position was 20 minutes old and the map drops it; the others were
  at most ten minutes old. The bounds are the zone where riding is allowed
  (44.1784–44.2116, 0.6074–0.6443) plus about 0.01°. None of the 13 zones
  sets hours, the city sets none, and no night ban was found.

## Findings that affect integration

- **Dott:** the [France country entry point](https://gbfs.api.ridedott.com/public/v2/countries/fr/gbfs.json)
  is a flattened list with repeated feed names for multiple cities. Selecting the
  first `free_bike_status` entry would cover only one city. The app uses reviewed
  city-specific discovery documents instead.
- **Pony:** the government proxy now serves **GBFS 3.0**, using unlocalized
  `data.feeds`, `vehicle_status`, `data.vehicles`, `vehicle_id`, and ISO timestamps.
  Other integrated operators use GBFS 2.2/2.3, localized discovery,
  `free_bike_status`, `data.bikes`, and Unix timestamps.
- **Lime and Voi:** the sampled public feeds provide remaining range but no battery
  percentage. The app retains `battery: null`; it does not invent a percentage
  from vehicle range. A positive battery filter excludes unknown batteries.
- **Rental links:** Dott publishes vehicle links; Voi links to its nearest-vehicle
  flow; Pony links to its scanner. Bird and Lime supplied no vehicle rental links
  in these feeds. Only the supplied, provider-validated links are exposed, so
  Naolib Micromob's scooters, which Pony's feed links to Pony's scanner, have none.
- **Feed health:** successful HTTP responses can contain abandoned data. The new
  adapter rejects missing timestamps or data older than fifteen minutes. An unavailable
  city feed does not discard other successful city feeds.
- **Bounds:** geofencing envelopes have conservative padding; Lime's feeds lack
  geofencing, so reviewed metropolitan bounds, or town boundaries west of Paris,
  are used. These are fetch-routing
  envelopes, not legal riding or parking zones. A stray Pony Angers record was
  observed outside its region; records outside the configured service bounds
  are excluded. Changes in service areas need a catalog review.
- **Search:** supported French city names are answered from the catalog; French
  streets, addresses and places come from Geoapify (OpenStreetMap), or from
  Photon when Geoapify cannot answer. City names are deduplicated when two
  operators cover the same place.

## Feeds not enabled

| Finding | Evidence / next step |
| --- | --- |
| Dott GPSEO | The catalog's old city discovery returned HTTP 404. The working Voi GPSEO feed is enabled. |
| Dott OL Vallée | Current status returned zero vehicles; keep as a candidate rather than claiming current availability. |
| Central Paris | Sampled Dott, Lime, and Voi feeds returned bicycles and zero available standing scooters. Nearby GPSEO, SIEMU, Versailles, Saint-Quentin-en-Yvelines and Lime west of Paris are separate systems. |
| Other Lime feeds | Nice and Sophia Antipolis returned zero available standing scooters in this sample. |
| Other Pony feeds | Nice, Limoges and Pays Basque returned zero available standing scooters in this sample. On 13 October 2026 Tours, Orléans, Limoges, Nice and Marseille listed e-bikes only, Pays Basque e-bikes and one disabled scooter, and Paris 9 disabled scooters; see [Pony, October 2026](#pony-october-2026). |
| Voi V'Lônes | Returned bicycles and zero available standing scooters in this sample. |
| Historical Bird feeds | Bordeaux returned only unavailable/bicycle data with an old timestamp. Castres, Dieppe, Draguignan, Épron, Gap, Hérouville-Saint-Clair, La Roche-sur-Yon, Marseille, Millau, Montluçon, Ouistreham and Sarreguemines returned empty status with timestamp 0. |
| Lime Le Havre | The [official listing](https://transport.data.gouv.fr/datasets/gbfs-le-havre-2) describes a secured feed whose credentials are provided to approved partners. No authenticated access was attempted. Voi Le Havre is enabled. |

Empty feeds are snapshot observations, not proof that an operator has permanently
left a city. The enabled catalog deliberately contains only positively verified
individual-scooter feeds.

## Source terms

Public accessibility is distinct from a blanket redistribution license.
The [Dott country listing](https://transport.data.gouv.fr/resources/82747?locale=fr)
points to [Dott's API license](https://ridedott.com/api-licence/), which describes
internal application development and restricts commercial benefit and distribution
of API/data. Those terms need review before publicly deploying this Dott integration.

Bird's `system_information` points to its
[GBFS Data License](https://www.bird.co/wp-content/uploads/2019/03/GBFS-Data-License-Agreement-2018-09-25.pdf).
Lime's `system_information` points to [Lime GBFS terms](https://www.li.me/gbfs-terms).
The sampled Pony and Voi system-information documents did not supply a license URL;
consult their individual National Access Point dataset terms. La Roche-sur-Yon's
Pony dataset is under the Licence Ouverte 2.0; its key, which the access point
publishes, also reads Pony's other towns (see [Pony, October 2026](#pony-october-2026)),
among them Nantes, whose Naolib Micromob' scooters Nantes Métropole also publishes
under the Licence Ouverte (see [Naolib Micromob', October 2026](#naolib-micromob-october-2026)). Government proxying
alone should not be treated as a new license. Operator attribution is included in
the map, footer, and API response header.

## Recheck

```sh
npm run check:france
# Machine-readable snapshot without individual vehicle IDs or coordinates:
node scripts/check-french-feeds.mjs --json
```

The checker uses four concurrent systems, follows discovery links within each
reviewed city URL base, verifies status timestamps, and returns a nonzero exit code
on feed failures. It does not modify the catalog or deploy the application.

Each failure names Dott's error code. An entry whose feed answers 401, 404 or 410
(Dott: `ERR_REGION_NOT_FOUND`) is **gone** and should leave the catalog. A Dott
region answering 403 `ERR_REGION_OFFLINE` is **paused**: Dott closes Tignes out
of season, and Bourgoin-Jallieu has been closed since early October 2026. A paused
region does not fail the check, and the map treats it as a system without scooters.
The checker also reads Dott's listing of each country once, names the catalog
entries it does not list, and the listed regions with scooters the catalog lacks.

`npm run check:catalogs` checks France, Germany and Italy together. The
[catalog check workflow](../.github/workflows/catalog-check.yml) runs it every
Monday with `--fail-on=gone`: only a gone entry fails it, so GitHub sends a notice.

The application adapter was also exercised against live feeds for Lyon, Marseille,
Bordeaux, Angers and Zürich. Both EUR French tariffs and CHF Swiss tariffs were
preserved where published. No deployment was performed as part of this investigation.
