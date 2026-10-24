# MoVe rider map

Verified 24 October 2026 with Android `move.mobility.app` 10.80 and a
user-authorized rider account. The [app identity checks](atom-operator-apps.md)
and [shared ATOM protocol](atom-app-map.md) apply. App identifiers, rider
tokens and phone details remain outside Git and the public API.

## Coverage and live evidence

The current authenticated map supplies **New Brunswick**, rather than the
Halifax/Dartmouth coverage described in the store listing. One verified
collector read returned 337 available electric standing scooters:

| City | Province | Available scooters |
| --- | --- | ---: |
| Fredericton | NB | 73 |
| Moncton | NB | 146 |
| Saint John | NB | 118 |

All 337 had battery charge. Across thirteen subsequent map checks, ten
scooters offered at least once changed position by at least 20 metres:
five in Fredericton, three in Moncton and two in Saint John. Some changes
were visible in the map's hidden markers while the scooters were
unavailable. Hidden markers are used only to validate freshness; they are
excluded from the published fleet, as are active rides.

Queries centred at Halifax, Fredericton and Moncton returned the same
account-wide fleet, with normal availability changes between reads. A
Halifax request is therefore not evidence of Halifax scooters. No MoVe
scooters there were observed. Other operators' regions are not inferred from this account.

## Collection

`move_ca_new_brunswick` is one source with three city areas, their province
`NB`, and time zone `America/Moncton`. `atomAppAccount: "move-ca"` selects its
private credentials. `atomAppFullMap: true` makes one native map request
per collection, instead of applying Qick's two-kilometre grid to this
account-wide reply. The shared ATOM request queue and session renewal still
apply. The provider is MoVe, linked to its
[official app link](https://move-mobility.app.link/).

Moncton and Saint John's bounds follow their operating polygons, with a
one-kilometre margin. Fredericton publishes parking polygons rather than
one comparable outer service outline, so its reviewed bounds enclose those
polygons and observed scooters with the same margin. The collector filters
to the union of the three city areas; intercity points and unreviewed new
markets are excluded. Operating polygons do not become public riding or
parking guidance through this adapter.

Moncton's by-law stops shared scooters from 15 November until 16 April at the
latest, so the catalog pauses the Moncton area for that window
([Canada's winter section](canadian-scooter-feeds.md#winter)).

The Node collector was tested from the production cache container on
Netcup: Node 26.12.1 returned HTTP 200 with 337 scooters. The private MoVe
session was appended to the existing ATOM volume without a restart,
preserving Qick's sessions. Deployment follows passing CI.

## Sign-in

The user-authorized US SMS requests returned success, but delivery was not
confirmed. The supplied German number received a code, phone verification
succeeded, and `user/register` accepted the supplied name and email. The
resulting rider token is stored under `move-ca` in the shared private ATOM
session bundle. SMS codes, phone tokens and profile data do not belong in
the catalog or diagnostics.
