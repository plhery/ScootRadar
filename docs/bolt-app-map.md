# Bolt rider map

Integrated on 25 October 2026 with a user-authorized rider account, verified
the day before with Bolt Android `ee.mtakso.client`, CA.230.0, build 4390.
The installed APK's signature matches the publisher's
[app-link association](https://bolt.eu/.well-known/assetlinks.json). The
user completed phone verification and registration. No ride, reservation or
payment action was performed, and the account needs no payment card to read
the map. The Node-only adapter is [server/boltApp.ts](../server/boltApp.ts).

The catalogs add 118 Bolt markets in 18 countries, about 111,000 scooters on
25 October 2026: Germany 22 markets (41,000 scooters), Poland 21 (25,150),
Estonia 10 (6,750), Sweden 3 (6,300), Romania 8 (5,650), Latvia 12 (5,150),
Portugal 5 (4,600), Lithuania 8 (4,150), Ukraine 13 (4,100), Belgium 5
(2,100), Slovakia 2 (1,400), Kazakhstan 1 (1,200), Bulgaria 3 (1,200),
Iceland 1 (850), Cyprus 1 (445), Slovenia 1 (375), Moldova 1 (305) and
Ireland 1 (39). Estonia, Lithuania, Slovakia, Bulgaria, Moldova, Slovenia and
Ireland are new countries.

## Requests

`POST https://user.live.boltsvc.net/micromobility/search/getVehicles/v2`
takes `{viewport: {top_right, top_left, bottom_right, bottom_left},
should_include_style_config}`, each corner `{lat, lng}`, with a rider access
token as `Authorization: Bearer …` and the Android app's query parameters
(`version`, `deviceId`, `device_name`, `device_os_version`, `channel`,
`brand`, `deviceType`, `country`, `language`, and the GPS position and a
session id).

The answer is `{code: 0, data: {categories: [{id, markers_on_map:
[{vehicle: {id, vehicle_type, charge, location, hide_battery_charge?}}]}]}}`.
Types are `scooter_<n>`, `ebike_<n>` and `mechanical_bike_<n>`; only
scooters are kept. Charge is a percentage, hidden when
`hide_battery_charge` is set. There is no range, price or position
timestamp, and no rental link is made. Since 29 October 2026 the card's
**Open in Bolt** opens Bolt's app on the store link Bolt's feeds publish,
`https://bolt.sng.link/Epy3j/o9sr`, which the app claims; without the app, a
phone goes on to its store (`data/providers.json`).

The viewport selects a market, and the answer is the whole market, however
small the viewport: a box of a few hundred metres in Riga returned the
city's 4,000 scooters. The answer names no market; its category ids do.
Each system lists its market's scooter categories (`boltAppCategories`,
from the market's operating areas), and an answer that holds none of them
is refused as another market's, so a centre that drifts into a neighbouring
market fails loudly rather than publishing the wrong town's scooters. The
collector asks once per market, from the system's centre, with a viewport
of ±0.005° around it, and keeps the scooters inside the system's bounds.

`GET /micromobility/cityArea/listByPosition` at zoom 6 lists each market's
operating areas, with their `city_id` (`boltAppCity`) and
`search_category_id`, and their outlines as polylines (precision 5). It
answers for the markets near the GPS position in the app's query
parameters, not for the box: a box over a whole country, asked from one
town, lists that town's market. The catalog was built from them; the
collector does not read them.

## Session

`POST https://node.bolt.eu/user-auth/profile/auth/getAccessToken`, with
`Authorization: Bearer <refresh token>`, mints a one-hour access token
(`access_token`, `expires_timestamp`, `expires_in_seconds` 3600,
`next_update_in_seconds` 3540). The refresh JWT lasts about a year, and no
renewal on 24 or 25 October rotated it; if one does, the adapter saves the
new refresh token before using the access token. Revocation or a policy
change can still require another sign-in.

The cache reads mode-0600 `bolt-session.json` beside its snapshot,
`/data/bolt-session.json` in production (`BOLT_SESSION_PATH` overrides it):

```json
{ "version": 1, "refreshToken": "<refresh JWT>", "deviceId": "<the app's device id>" }
```

It is rewritten atomically through `tmp/` beside it, mode 0600. The access
token stays in memory. Renewal is single-flight, starts a minute before the
token's next update and backs off a minute after a failure. A map request
answered 401 renews once and retries; a second 401 fails that collection. A
429 holds every market for its `Retry-After`, at least a minute and at most an
hour. Errors never carry tokens or upstream bodies.

## Cadence

Bolt's app map is collected like Voi's: each market every twenty minutes
while nobody looks, every minute for ten minutes after someone does, one
request each, with all markets sharing one request every half second. That
is about 7,000 requests a day while nobody looks. The fifteen-minute retention
of Bolt's GBFS licence is keyed to `mds.bolt.eu` and does not apply here.

## Completeness

- Reads from the far side of a market (Berlin, Hamburg, Munich, Frankfurt,
  Cologne, Düsseldorf, Riga, Tallinn, Warsaw, Kraków, Gdańsk, Vilnius,
  Stockholm, Oslo, Bucharest, Lisbon, Brussels) returned the same scooters
  within two. No cap was seen: Berlin's answer held 9,738.
- Two reads of every market 7 to 14 minutes apart kept all but a few
  scooters, and a handful per market had moved more than 50 m.
- A handful of scooters per market stand outside the operating areas
  padded 0.01°.
- Each catalog system was read once more through `collectBoltRegion` from
  its own centre, half an hour later. Each selected its market, 103,056
  scooters in all, each count within 5% of the research read but Chișinău's
  (342 against 306). Early that afternoon all 118 systems, with the 20
  found later, were read through it again: each selected its market,
  110,163 scooters in all. Each of the 20 was within 5% of its research
  read but Cherkasy (50 against 46).

## Finding the markets

Bolt's city pages (`bolt.eu/en/cities/`) led to the first 98 markets.
Because `listByPosition` answers by position, 20 more with scooters came
from asking it over a grid of boxes, from each city page's town again, and
from each of the 1,861 towns of 50,000 people or more that no known market
held, two seconds apart, in the countries of Bolt's city pages and Iceland
(less ten in Africa, Asia and South America the map doesn't cover): Dresden,
Antwerp, Liège, Charleroi, Varna, Burgas, Nicosia, Reykjavík, Almaty,
Bydgoszcz, Kielce, Elbląg, Tarnów, Porto with Matosinhos, Faro, Santarém,
Zaporizhzhia, Bila Tserkva, Zhytomyr and Cherkasy. The towns found 70
markets that neither the first 98 nor the grid held, most of them without
scooters. Bolt's markets in smaller towns, away from any other, may still be
missing.

## The catalog

One system per market, `bolt_<cc>_app_<city_id>`, centred where the market
was found (Bolt's city page, geocoded with GeoNames). Its towns are its areas:
the catalog town whose centre an operating area holds, an outlined town
holding its scooters, the town of Bolt's city page, or GeoNames' largest
town of 10,000 people or more for an area of ten scooters or more that none
of those is near. Names are the catalogs' own ("Köln", "Warszawa", "Rīga",
"Gdańsk / Gdynia / Sopot", "Katowice / Chorzów"), and new towns have their
English and unaccented names as aliases. Each area's bounds hold its operating
areas, padded 0.005°, and the catalog town's bounds within the market. A town
with fewer than ten scooters is left out unless its outline is listed in
`data/town-outlines.json`, where the site would otherwise drop them: Herne (1)
and Mülheim an der Ruhr (6) are kept for that reason.

Left out because another source already shows them: Stuttgart, Karlsruhe and
Reutlingen/Tübingen (MobiData BW), Brussels and Liverpool (Bolt's GBFS), Oslo
(Entur), and Zürich and Basel (the Swiss national platform, which also
carries Basel's scooters into MobiData BW). Since 28 October 2026 Zürich's and
Basel's markets are read for the national platform's feeds instead, which keep
their towns, prices and rental links (`server/swissAppMaps.ts`, DATA_SOURCES.md):
Zürich's categories 735, 1166 and 1212, the last two with 115 and 840 scooters
that day, and Basel's 899, with 154.

Markets with operating areas but no scooter on 25 October 2026, left out:
Marijampolė, Prague (and the other Czech towns Bolt lists), Baku, Braga,
Dnipro, Poltava, Trenčín, Radom, Rijeka, Osijek, Winterthur, Lübeck, Brașov,
Saulkrasti, Málaga, Zaragoza, Oviedo, Piatra Neamț, Ypres, Drammen,
Kristiansand, Moss, Koper, Maribor and Lielvārde; Paris, Grenoble, Naples,
Parma, Burgos, Sanlúcar de Barrameda, Gütersloh, Kharkiv, Chernihiv,
Mukachevo, Tbilisi, Batumi, Kutaisi, Lillestrøm, Fredrikstad and Cape Town. Barcelona,
Sevilla, Huelva, Astana, Słupsk and Suwałki listed scooter categories with no
scooter in them. Helsinki, Madrid, Bilbao, Bologna, Modena, Bergamo, Zagreb,
Split, Zadar, Pula, Košice, Žilina, Banská Bystrica, Martin, Uppsala,
Linköping, Västerås, Helsingborg, Borås, Eskilstuna, Karlstad, Trondheim,
Sumy, Lutsk, Płock, Włocławek, Grudziądz, Konin, Inowrocław, Ostrów
Wielkopolski, Głogów and Sumqayit are Bolt markets without scooters. Enschede
and Groningen (the Netherlands) and Bolt's other markets outside the map's
countries are left out. No scooter market was found
for Brno, Aarhus, Ostrava, Olomouc, České Budějovice, Salzgitter, Bernburg,
Staßfurt, Constanța, Galați, Pitești, Râmnicu Vâlcea, Târgu Jiu, Trnava,
Zvolen, Gorzów Wielkopolski or London. A market that fills up again needs its
system added; one Bolt closes fails as "another market" or empty.
