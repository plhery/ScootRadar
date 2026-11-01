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

Lime's scooters in Canberra, about 1,370, were added after a clean full-area
audit on the morning of 27 October 2026, Canberra time. Lime has been the
Territory's only shared e-scooter operator since 16 April 2026, on a
three-year permit, and neither the government's announcements nor its
[Dockless Shared Micromobility Policy](https://www.transport.act.gov.au/__data/assets/pdf_file/0004/2870797/Dockless-shared-micromobility-policy-June25.pdf)
(June 2025) sets riding hours. The region is `6UR2XJRNHWDYF`, and the market
uses `Australia/Sydney`. Its public outline document is:

- [Canberra region service polygons](https://assets.lime.bike/zones_attributes/Canberra_249_exclude_new_type.json)

Lime's Perth region held no scooter that morning: the City of Perth suspended
e-scooter hire on 5 June 2025, and its scheme ran with Beam and Neuron.

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

## Night bans

Geraldton is the one covered Australian town where renting stops at night, an
entry in [`rental-curfews.json`](../data/rental-curfews.json) from 01:00 to
05:30, Perth time, inside the City of Greater Geraldton.

- **The hours are Beam's.** Beam, the only operator, listed 180 scooters there
  at 00:50 and none from 01:10 to 05:30, back by 05:50, on the nights of 1 and
  2 November 2026 (Prometheus, collected every 20 minutes, feed ok
  throughout). Perth, Bunbury, Broome and Esperance, in the same time zone,
  kept theirs, so it isn't an outage. On 25 October, under the old agreement,
  the map listed 221 to 225 there all night.
- **The council's terms.** In January 2026 the council asked that any new
  agreement switch hired scooters off from midnight to 5:30 (CEO report, item
  CEO143; Geraldton Guardian, 28 January 2026). On 28 July 2026 it voted a
  two-year deed with Beam whose terms the chief executive settles (item CEO152,
  [minutes](https://www.cgg.wa.gov.au/council-meetings/ordinary-council-meeting/28-july-2026-ordinary-meeting-of-council/243/documents/confirmed-minutes-ordinary-meeting-of-council-28-july-2026-public.pdf)).
  The deed isn't public. The map's 01:00 start, not the draft's midnight, is
  what riders meet, as with Voi in Arendal; if the City publishes the deed's
  hours, use those.
- **Boundary:** the City of Greater Geraldton in OpenStreetMap (relation
  11689919), read through Nominatim and simplified to within 100 m, with the
  Abrolhos Islands as a second ring. © OpenStreetMap contributors, under the
  [ODbL](https://opendatacommons.org/licenses/odbl/); the map's credits name it
  as "AU: OpenStreetMap boundaries · ODbL".
