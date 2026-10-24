# Malaysia scooter feeds

Verified 24 October 2026 through Beam's authenticated rider map in the
unmodified official Android app. The user completed Google sign-in; map
reads and session renewal also succeeded from Netcup's Node cache runtime.
The reviewed catalog contains 10 collection regions and 1,156 standing
scooters in the initial samples. These are observations, not expected totals.

[The Beam collector guide](beam-app-map.md) records app provenance, the
GraphQL route, H3 coverage, credential handling and live verification. Each
entry in [the catalog](../data/malaysian-scooter-feeds.json) binds the
app's numeric city id to reviewed bounds and a local time zone. Some regions
combine towns or campuses; their app names are retained.

| Collection region | Beam city id | Observed scooters |
| --- | ---: | ---: |
| Johor | 353 | 75 |
| Kuala Lumpur | 12 | 585 |
| Kuantan | 1443 | 7 |
| Malacca | 1061 | 25 |
| Pahang | 2685 | 19 |
| Penang | 354 | 3 |
| Perak | 1263 | 66 |
| Sarawak | 2258 | 90 |
| Selangor | 349 | 205 |
| Terengganu | 2139 | 81 |

Only standing scooters belonging to the reviewed city and envelope are
published, with stable ids, coordinates and percentage charge. E-bikes,
seated scooters and unclassified vehicles are excluded. Every H3 batch must
succeed before a new snapshot replaces the previous one. No price, range,
vehicle rental link, parking guidance or zone is inferred.

Perak, Selangor, Johor and Sarawak use disjoint operating envelopes to avoid
querying empty gaps between campuses. The other regions use complete
rectangular envelopes. Sarawak uses Asia/Kuching; the others use
Asia/Kuala_Lumpur. Address display follows the [UPU Malaysia guide](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/mysEn.pdf).
