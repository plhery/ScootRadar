# South Korean scooter app map investigation

Checked 24 October 2026 by statically inspecting the Play-distributed Android
apps of Swing, GCOO and Kickgoing and making bounded, signed-out map requests,
from 22:45 to 23:10 Korea time (15:45 to 16:10 Paris). All three maps return
live vehicle positions without a rider account:

- **GCOO** and **Kickgoing** answer plain HTTP requests with no credential,
  app header or bootstrap call.
- **Swing** answers only with its app's one-time code header, computed from a
  constant compiled into the app. Without it the map answers 400 with an
  empty body.

Kickgoing's map also carries **Xingxing**'s scooters, through the two
operators' alliance. GCOO's API also serves its US fleets: it answered
with scooters in Los Angeles, Alexandria and Memphis.

All three were checked from Netcup as well as the Mac, with the same results.
No rider login, SMS, registration or vehicle action was performed. About 40
requests were made in all. All three are collected since that evening: see
[the South Korean feeds](south-korean-scooter-feeds.md) for the catalog, the
request plans and the load.

## App provenance

APKPure's downloads passed Android `apksigner verify`, and each base APK
carries a verified Google Play source stamp (stamp certificate
`3257d599a49d2c961a471ca9843f59d341a405884583fc087df4237b733bbd6d`), so
Google Play distributed them.

| App | Package | Version / build | Built with |
| --- | --- | --- | --- |
| [GCOO](https://play.google.com/store/apps/details?id=io.gbike.gcooter) | `io.gbike.gcooter` | 3.4300.05 / 26101302 | React Native, Hermes bytecode 98 |
| [Kickgoing](https://play.google.com/store/apps/details?id=com.olulo.kickgoing) | `com.olulo.kickgoing` | 2.11.23 / 346 | React Native, Hermes bytecode 96 |
| [SWING](https://play.google.com/store/apps/details?id=com.co.swing) | `com.co.swing` | 4.8.1 / 20386 | Kotlin, Retrofit |

Signer certificate SHA-256 fingerprints:

- GCOO: `1c1b2b1d1c0f260e1a6717daef7168323f2d82fdd131f9fad70b805761c50816`,
  listed in GCOO's [app-link association](https://open.gbike.io/.well-known/assetlinks.json).
- Kickgoing: `8be1127717ec9f8ec1afcbab78a3641059dca0377c682ab437b3d472bc98ca82`.
  `kickgoing.io` publishes no association; the app's links go through
  `kickgoing.page.link`.
- Swing: `907ec7e6fa841e2d6d9be9cb5164e959b676130c352f9e7e6374a041d0e6d6e5`.
  Swing's associations (`tswm.link`, `swing.tswm.link`,
  `qrcode.theswing.co.kr`, `qr.jp.swingmobility.dev`) list a different
  certificate, `89d7999c…699d`, so here the Play source stamp is the
  provenance.

APKs, decompiled code and raw live responses stay outside the repository.

## GCOO: open bounding-box read

The bundle's API table names `/api/v1/locations/markers` on the live host:

```http
GET https://live.api.gbike-api.com/api/v1/locations/markers?min_lat=37.495&min_lng=127.020&max_lat=37.505&max_lng=127.035
```

No header is needed, but the host's firewall answers 403 to Python's
default `Python-urllib` User-Agent; curl's and an ordinary one pass.

The reply is `{"result_code": 0, "response": {"list": [...]}}`. A vehicle has
`id`, `scooter_number`, `lat`, `lng`, `battery` (percent), `gcooter_status`
(`IDLE`), `is_activated`, `region_id`, `region_name` and `model_info`
(`id`, `name`). Discount parking spots come in the same list (`id`
`discount_spots_<n>`, `zone_info`, coordinates as strings). Once a box is
wide enough the server returns clusters instead: `{"id": "cluster_<n>",
"count": 80, "model_info": {"id": 1000, "type": "cluster"}}`. Around
Gangnam station a 1.1 × 1.3 km box came back whole, while 2 km and 3 km
boxes came back as 48 and 49 clusters holding 440 and 837 vehicles. A
collector has to split any box that returns clusters.

The marker carries no vehicle type. The app maps model ids to scooters
(`SCT`) and bicycles (`BYC`):

| Type | Model ids |
| --- | --- |
| Scooter | ES4 9, MAX 10, MAXPro 11, K 12, MAXPlus 13, K2 16, MAXPlusX 19, K3 23 |
| Bicycle | BICYCLE_GCOO 17, BICYCLE_SEGWAY 18, B4 22, BICYCLE_A200P 24, and the `BITHUMB_BICYCLE` and `UPGRADE_B4` markers |

The replies used names as well: `Max Plus` (13), `Max Plus X` (19) and
`GCOO-K2` (16) for scooters, and `GCOO-B2` (18), `GCOO-B3` (17) and
`GCOO-B4` (22) for bicycles. At Gangnam, 42 of the 152 `GCOO-B4` came with
id 10006, which the app's table lacks, so a collector should keep only the
known scooter ids.

Service areas are public: `https://region.gbike.io/kr/all_polygons.json.gz`
(791 service areas with bounds, plus no-parking, geofence, discount and
penalty-parking areas) and `https://region.gbike.io/us/all_polygons.json.gz`
(seven areas in Los Angeles, four in Memphis, Alexandria and Arlington, and
maintenance and lost-vehicle entries with no outline). The Korean areas'
bounds add up to about 8,000 km², about 5,600 cells of 1.2 km, so collection
has to start from bigger boxes and split only where clusters come back.

| Sample | Vehicles | Scooters |
| --- | ---: | --- |
| Seoul, Gangnam station (1.1 × 1.3 km) | 183 | none: 152 `GCOO-B4` and 31 `GCOO-B2` bicycles |
| Busan, Haeundae | 111 | 22 Max Plus (89 `GCOO-B2`) |
| Daegu, centre | 87 | 66 Max Plus (21 `GCOO-B2`) |
| Sejong (4.5 × 3.9 km) | 12 plus 29 clusters of 775 | 10 `GCOO-K2` |
| Alexandria, VA | 4 plus 28 clusters | 4 Max Plus X |
| Memphis, downtown | 2 | 2 Max Plus X |
| Los Angeles, Koreatown | 4 plus 34 clusters | 4 Max Plus |

## Kickgoing: open radius read, with Xingxing

The map asks for its markers with:

```http
GET https://api.kickgoing.io/v4/kickscooters?version=2.11.23&lat=37.4979&lng=127.0276&zoom=16&alliance=kickgoing
Content-Type: application/json
```

`version` is the app's version. The app adds `Authorization: Bearer …`
only when a rider is signed in, and
`&mobility=kickboard` or `&mobility=bike` when the map's filter is set. The
reply holds `kickscooters`, `clustered_kickscooters`, `service_area_centers`,
`nodes` (parking spots) and `map_radius`. A vehicle has `id`,
`serial_number`, `lat`, `lng`, `battery_rate` (percent),
`battery_available_minutes`, `mobility_type` (`kickboard` or `bike`),
`alliance` and `provider` (`kickgoing`, `xingxing` or `tmap`). Xingxing's
also have `manufacture_by`.

The zoom sets what comes back:

- **Zoom 16:** single vehicles. At Gangnam station that was 1,252 within
  3.7 km: 1,025 scooters and 227 bikes, 776 Kickgoing's, 475 Xingxing's and
  one TMAP bike. At Haeundae it was 363 within 1.7 km, all Kickgoing's (211
  scooters, 152 bikes). `map_radius` was 1000 in both.
- **Zoom 13:** 557 clusters with counts, `map_radius` 4000.
- **Zoom 8:** from central Korea, 178 `service_area_centers` (38 in Seoul,
  37 around Busan) and `map_radius` 50000. Six of them are in Japan, south
  of Kyushu: four on Yakushima (30.46, 130.49) and two at 30.16, 129.92.

`/v4/service-areas` and `/v4/alliance/service-areas` redirect without a
rider session, so those centres are the signed-out list of areas.

## Swing: guest read behind the app's one-time code

The Retrofit interface `com.co.swing.bff_api.map.MapApi` calls:

```http
GET https://sfr.swingmobility.dev/map/marker/vehicles?east=127.035&south=37.495&west=127.020&north=37.505&center=37.4979,127.0276&mapType=NAVER&mapZoomLevel=16&VEHICLE=ALL&DISCOUNT=ALL&BATTERY=ALL
```

`InterceptorUtils` adds these headers to every request:

- `X-SW-OS-PLATFORM: AOS`, `X-SW-OS-VERSION`, `X-SW-DEVICE-MODEL`,
  `X-SW-DEVICE-LOCATION` (`lat,lng`),
  `X-SW-DEVICE-GPS-ACCURACY`;
- `X-SW-APP-VERSION: 4.8.1`, `X-SW-APP-BUILD-NUMBER: 20386`,
  `X-SW-APP-LANGUAGE`, `X-SW-OS-LANGUAGE`, `User-Agent: SWING/4.8.1`,
  `X-SW-APP-TS` (milliseconds);
- `X-SW-OS-FSAN`, a six-digit RFC 6238 one-time code (HMAC-SHA512,
  30-second step) keyed with a Base32 constant in the same class.

`Authorization` is added only for a signed-in rider. Without `X-SW-OS-FSAN`
the map answered 400 with an empty body. With it, signed out, it answered 200
with `X-SW-API-STATUS: OK`.

The reply holds `vehicles`, `places`, `clusters` (null at zoom 16) and
`meta.calcBounds`. The server widened the 1.1 × 1.3 km box to about
5.3 × 4.4 km and returned every vehicle in it, unclustered. A vehicle has
`imei`, `lat`, `lng`, `type` (`SCOOTER`, `BIKE` for e-bikes, `NORMAL_BIKE`,
`MOPED`), `battery` (`FULL`, `HIGH`, `MIDDLE` or `LOW`, not a percent),
`vendor`, `model` and `selected`. `VEHICLE=SCOOTER` returned the same 1,775
non-scooters as `VEHICLE=ALL` at Gangnam, so a collector must filter on
`type` itself. The id is the device's IMEI: hash it rather than store or
show it.

`GET map/geofence` answers with a hash and the address of a gzipped SQLite
file on `cdn.swingmobility.dev` (20 MB, 106 MB unpacked), whose tables
index each zone by H3 cell, zone type and vehicle type. It holds 398 scooter
service areas, from Jeju to Gangwon, whose bounds add up to about 8,100 km².

| Sample | Vehicles | Scooters |
| --- | ---: | --- |
| Seoul, Gangnam station | 1,775 | none: 1,541 e-bikes, 215 bikes, 19 mopeds |
| Busan, Haeundae | 726 | 474 (`S11`) |
| Daegu, centre | 425 | 425 (`S9`) |

## Freshness

Fetching the first Gangnam request again 5 to 10 minutes later:

| Operator | First fetch | Second | Gone | New | Moved over 20 m | Battery changed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| GCOO | 183 | 177 | 6 | 0 | 0 | 4 |
| Kickgoing | 1,252 | 1,259 | 25 | 32 | 7 | 40 |
| Swing | 1,775 | 1,786 | 5 | 16 | 40 | 3 |

None of the three gives a per-vehicle timestamp, so the age of a position
can't be checked against the map's fifteen-minute limit.

## Since the investigation

The user asked for all three collectors on 24 October 2026, Swing's one-time
code included, and South Korea was added as a country. Building them showed:

- **Kickgoing** answers at zoom 15 with every vehicle within 2.4 km, with no
  cap and `map_radius` 1500, and at zoom 14 and below with clusters only.
- **Swing** returns scooters only with `VEHICLE=SCOOTER` and
  `selectedOnly=true` together. Its server reads a box four times as tall and
  as wide as asked, so one request reads a whole town, and asks for a pause
  between requests in `meta.throttleMs`.
- **Fleet sizes:** a sweep around midnight Korea time found 58,741 Swing
  scooters, 57,338 GCOO, 18,924 Xingxing and 11,365 Kickgoing. Seoul's GCOO
  and Swing fleets are mostly bikes there.
- **Terms:** still none published by any of the three.
