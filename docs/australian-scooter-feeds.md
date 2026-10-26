# Australia scooter feeds

Verified 24 October 2026 through Lime's authenticated rider map. The catalog
registers the complete published operating polygons for **Brisbane**,
partitioned into small independent cache feeds. These groups count as one
destination; they are not separate towns.

The region is `GDXLUXEILIOHF`. Its public outline document is:

- [Publisher service polygons](https://assets.lime.bike/zones_attributes/Brisbane_2639_exclude_new_type.json)

Lime's scooters in Port Phillip, about 240, were added on 26 October 2026 the
same way, after a clean full-area audit of its e-scooter zone that morning;
see [the Lime guide](lime-app-map.md#every-market-the-map-lists-october-2026).
The region is `DSWYPCAYY423J`, named Melbourne in Lime's app, and searching
Melbourne or St Kilda finds it. Its public outline document is:

- [Melbourne region service polygons](https://assets.lime.bike/zones_attributes/Melbourne_3245_exclude_new_type.json)

Lime's Gold Coast region, where it rents e-bikes, held no scooter in its
audit that morning, nor did its Sydney region, a single small zone in
St Peters.

The market uses `Australia/Brisbane`. Only scooter pins inside the recorded
service polygons are included. Bikes, fares and vehicle-specific rental links
are excluded. Public feeds remain preferred wherever available.

See [Lime collection and session requirements](lime-app-map.md) for the local
view protocol, completeness checks, request quota and refresh cadence.

## Beam rider map

The catalog also includes 11 authenticated Beam collection regions, verified
on 24 October 2026: Adelaide, Broome, Bunbury, Cairns, Darwin, Esperance,
Geraldton, Hervey Bay, Mackay, Perth and Port Douglas. The initial samples
contained 2,821 standing scooters. These entries preserve Lime's Brisbane
coverage and use the [shared Beam collector](beam-app-map.md), with reviewed
city ids, bounds and each city's canonical local time zone.
