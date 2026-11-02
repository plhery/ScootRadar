package com.plhery.scootradar.core.model

/**
 * Streets of the catalog as data/ had them on a given day, for tests that need a real street's shape (logic.md LOG-370:
 * data/ is read again from the cities, so tests take its facts from here or from the generated data, not literals).
 */
internal object PinnedStreets {
    // Chicago's trails, at all hours and with no first day, as data/ had them on 2 November 2026 (LOG-370): the
    // lakefront trail's lines from the river's mouth along Grant Park and its north end at Ardmore Avenue, whose
    // bounds together take in the Loop; the Riverwalk's at Lake Shore Drive; The 606's at Damen Avenue.
    val chicagoTrails = listOf(
        CityRuleZone(
            id = "chicago-lakefront-trail",
            authority = "Chicago DOT, lines © OpenStreetMap",
            timeZone = "America/Chicago",
            firstDay = "",
            hours = emptyList(),
            source = "https://www.chicago.gov/city/en/depts/cdot/supp_info/escooter-share-pilot-project.html",
            lines = listOf(
                points(
                    41.987339, -87.654942, 41.987374, -87.654866, 41.987393, -87.654971, 41.98737, -87.655018
                ),
                points(
                    41.886576, -87.613355, 41.884928, -87.613174, 41.884651, -87.613042, 41.884251, -87.613036,
                    41.883617, -87.613087, 41.88344, -87.613132, 41.88333, -87.613199, 41.883221, -87.613312,
                    41.882995, -87.613647, 41.882793, -87.614129, 41.88269, -87.614603, 41.88263, -87.615685,
                    41.882556, -87.615983, 41.882439, -87.616238, 41.882199, -87.616531, 41.881606, -87.616971,
                    41.881428, -87.617039, 41.881045, -87.617092
                ),
                points(
                    41.886576, -87.613355, 41.886655, -87.612919, 41.886648, -87.612798, 41.883828, -87.612814,
                    41.883617, -87.612845, 41.883364, -87.612972, 41.883167, -87.613155, 41.882947, -87.613453,
                    41.882737, -87.613896, 41.882666, -87.614115, 41.882603, -87.614385, 41.882548, -87.614816,
                    41.882519, -87.615649, 41.882403, -87.616027, 41.88231, -87.61619, 41.882087, -87.616437,
                    41.88185, -87.616558, 41.881507, -87.616629, 41.881266, -87.616579, 41.880107, -87.61653,
                    41.877713, -87.616473, 41.877638, -87.616389, 41.874079, -87.61631, 41.874019, -87.616384,
                    41.868872, -87.616276, 41.86882, -87.616117, 41.868694, -87.615868, 41.868586, -87.61572,
                    41.868324, -87.615789, 41.868241, -87.615858, 41.868174, -87.615958
                ),
            ),
        ),
        CityRuleZone(
            id = "chicago-riverwalk",
            authority = "Chicago DOT, lines © OpenStreetMap",
            timeZone = "America/Chicago",
            firstDay = "",
            hours = emptyList(),
            source = "https://www.chicago.gov/city/en/depts/cdot/supp_info/escooter-share-pilot-project.html",
            lines = listOf(
                points(
                    41.887805, -87.613735, 41.88783, -87.614383, 41.887799, -87.614585, 41.887803, -87.614808,
                    41.887781, -87.614845, 41.887808, -87.615348, 41.887899, -87.615447, 41.887915, -87.615788,
                    41.887856, -87.615861, 41.887918, -87.616904, 41.887962, -87.616963, 41.887991, -87.617394,
                    41.887994, -87.617568, 41.887919, -87.618036, 41.88796, -87.618759, 41.888118, -87.618947,
                    41.888194, -87.619553, 41.88814, -87.61964, 41.88819, -87.620033, 41.888258, -87.620137,
                    41.888275, -87.620288, 41.888332, -87.620918, 41.888293, -87.620961, 41.888318, -87.621274,
                    41.888376, -87.621352, 41.888391, -87.621511, 41.88832, -87.621679, 41.888414, -87.622473,
                    41.888436, -87.623525, 41.888607, -87.624645, 41.888546, -87.625001, 41.888393, -87.625424,
                    41.888214, -87.625829, 41.888073, -87.625992, 41.888054, -87.626182, 41.887382, -87.62713,
                    41.887253, -87.627478, 41.887249, -87.627679, 41.887304, -87.627681, 41.887292, -87.628223
                ),
            ),
        ),
        CityRuleZone(
            id = "chicago-606-bloomingdale-trail",
            authority = "Chicago DOT, lines © OpenStreetMap",
            timeZone = "America/Chicago",
            firstDay = "",
            hours = emptyList(),
            source = "https://www.chicago.gov/city/en/depts/cdot/supp_info/escooter-share-pilot-project.html",
            lines = listOf(
                points(
                    41.914675, -87.668453, 41.914611, -87.668221, 41.914545, -87.668144, 41.914417, -87.66813,
                    41.914334, -87.668207, 41.914299, -87.668362, 41.914236, -87.66919, 41.914239, -87.669971,
                    41.914097, -87.677107, 41.914114, -87.677289, 41.914241, -87.677845, 41.914275, -87.678129,
                    41.914289, -87.679147, 41.914247, -87.680127, 41.914121, -87.681442, 41.914047, -87.682549
                ),
            ),
        ),
    )

    // Edmonton's Whyte Avenue, 82 Avenue from 112 to 97 Street, whole, as data/ had it on 2 November 2026.
    val whyteAvenue =
        CityRuleZone(
            id = "edmonton-whyte-avenue",
            authority = "City of Edmonton, lines © OpenStreetMap",
            timeZone = "America/Edmonton",
            firstDay = "",
            hours = emptyList(),
            source = "https://www.edmonton.ca/transportation/cycling_walking/bike-electric-scooter-sharing",
            lines = listOf(
                points(
                    53.518074, -113.497462, 53.518036, -113.497631, 53.518037, -113.497792, 53.518049, -113.499378,
                    53.518079, -113.499502
                ),
                points(
                    53.518074, -113.497462, 53.518121, -113.497633, 53.518124, -113.499371, 53.518079, -113.499502
                ),
                points(
                    53.5181, -113.506323, 53.518146, -113.506431, 53.518175, -113.520556, 53.51814, -113.520764
                ),
                points(
                    53.518079, -113.499502, 53.5181, -113.506323
                ),
                points(
                    53.5181, -113.506323, 53.518051, -113.506431, 53.518065, -113.520599, 53.518023, -113.520763
                ),
                points(
                    53.518099, -113.479729, 53.518113, -113.494758, 53.518073, -113.494922
                ),
                points(
                    53.518074, -113.497462, 53.518073, -113.494922, 53.518026, -113.494743, 53.518, -113.479728
                ),
            ),
        )

    // Tampa's streets as data/ had them on 2 November 2026: the Riverwalk by Curtis Hixon Park and a stretch of it
    // 1 km south-east, whose bounds together take in Morgan Street; a piece of Bayshore Boulevard; 7th Avenue whole.
    val tampaStreets = listOf(
        CityRuleZone(
            id = "tampa-riverwalk",
            authority = "City of Tampa, lines © OpenStreetMap",
            timeZone = "America/New_York",
            firstDay = "",
            hours = emptyList(),
            source = "https://www.tampa.gov/tss-transportation/programs/shared-micromobility-program",
            lines = listOf(
                points(
                    27.954372, -82.464466, 27.95408, -82.464525, 27.953962, -82.464454, 27.953872, -82.46447,
                    27.953747, -82.464454, 27.953691, -82.46449, 27.953618, -82.464628, 27.952555, -82.464876,
                    27.9521, -82.464955, 27.951793, -82.464945, 27.951583, -82.464907, 27.950757, -82.464576,
                    27.950265, -82.464247, 27.950259, -82.463971, 27.950215, -82.463968
                ),
                points(
                    27.94258, -82.449324, 27.942428, -82.449502, 27.941947, -82.449738, 27.941844, -82.449854,
                    27.941798, -82.449986, 27.941832, -82.450246, 27.941813, -82.450373, 27.941643, -82.450622,
                    27.94161, -82.450758, 27.941614, -82.45096, 27.941448, -82.451241, 27.941432, -82.451312,
                    27.941455, -82.451561, 27.941435, -82.451629, 27.941329, -82.451754, 27.941285, -82.451853,
                    27.941292, -82.452136, 27.941261, -82.452234, 27.941156, -82.452414, 27.941135, -82.452663,
                    27.941089, -82.452755, 27.940996, -82.45285, 27.940944, -82.452877, 27.940844, -82.452847,
                    27.940251, -82.454962, 27.9404, -82.455357, 27.940472, -82.455322, 27.940557, -82.455556
                ),
            ),
        ),
        CityRuleZone(
            id = "tampa-bayshore-boulevard",
            authority = "City of Tampa, lines © OpenStreetMap",
            timeZone = "America/New_York",
            firstDay = "",
            hours = emptyList(),
            source = "https://www.tampa.gov/tss-transportation/programs/shared-micromobility-program",
            lines = listOf(
                points(
                    27.914615, -82.491554, 27.915952, -82.491538, 27.916411, -82.491453, 27.918297, -82.491011,
                    27.918725, -82.490887, 27.919159, -82.490703, 27.919588, -82.490444, 27.919789, -82.490284,
                    27.920099, -82.489981, 27.920315, -82.489739, 27.92137, -82.488338, 27.922001, -82.48762,
                    27.922886, -82.486688, 27.923138, -82.486376, 27.923341, -82.486072, 27.925185, -82.483019,
                    27.926759, -82.480582
                ),
            ),
        ),
        CityRuleZone(
            id = "tampa-7th-avenue-ybor-city",
            authority = "City of Tampa, lines © OpenStreetMap",
            timeZone = "America/New_York",
            firstDay = "",
            hours = emptyList(),
            source = "https://www.tampa.gov/tss-transportation/programs/shared-micromobility-program",
            lines = listOf(
                points(
                    27.960248, -82.434743, 27.960294, -82.449941, 27.960322, -82.450206, 27.960456, -82.450735,
                    27.960467, -82.451246
                ),
            ),
        ),
    )

    // Four of Brighton & Hove's no-go places as data/ had them on 2 November 2026: Cranbourne Street and Kensington
    // Gardens whole, the piece of the Undercliff Walk below Rottingdean, and Hove Promenade whole, which ends west
    // of Hove Lawns.
    val brightonAndHove = listOf(
        CityRuleZone(
            id = "brighton-cranbourne-street",
            authority = "Brighton & Hove City Council, lines © OpenStreetMap",
            timeZone = "Europe/London",
            firstDay = "",
            hours = emptyList(),
            source = "https://www.brighton-hove.gov.uk/travel-and-road-safety/travel-transport-and-road-safety/beryl-e-scooters-trial",
            lines = listOf(
                points(
                    50.823186, -0.143759, 50.823341, -0.144621
                ),
            ),
        ),
        CityRuleZone(
            id = "brighton-kensington-gardens",
            authority = "Brighton & Hove City Council, lines © OpenStreetMap",
            timeZone = "Europe/London",
            firstDay = "",
            hours = emptyList(),
            source = "https://www.brighton-hove.gov.uk/travel-and-road-safety/travel-transport-and-road-safety/beryl-e-scooters-trial",
            lines = listOf(
                points(
                    50.826891, -0.138428, 50.82564, -0.138938
                ),
            ),
        ),
        CityRuleZone(
            id = "brighton-undercliff-walk",
            authority = "Brighton & Hove City Council, lines © OpenStreetMap",
            timeZone = "Europe/London",
            firstDay = "",
            hours = emptyList(),
            source = "https://www.brighton-hove.gov.uk/travel-and-road-safety/travel-transport-and-road-safety/beryl-e-scooters-trial",
            lines = listOf(
                points(
                    50.806691, -0.07243, 50.806451, -0.071614, 50.805614, -0.069228, 50.805378, -0.068481,
                    50.804399, -0.064728, 50.804055, -0.063531, 50.803588, -0.062113, 50.803243, -0.060822,
                    50.802809, -0.058594, 50.802607, -0.057726, 50.80245, -0.057375, 50.802307, -0.056946,
                    50.802041, -0.05593, 50.801876, -0.055397, 50.801867, -0.055248, 50.802032, -0.054905,
                    50.801655, -0.052715
                ),
            ),
        ),
        CityRuleZone(
            id = "hove-promenade",
            authority = "Brighton & Hove City Council, lines © OpenStreetMap",
            timeZone = "Europe/London",
            firstDay = "",
            hours = emptyList(),
            source = "https://www.brighton-hove.gov.uk/travel-and-road-safety/travel-transport-and-road-safety/beryl-e-scooters-trial",
            lines = listOf(
                points(
                    50.826669, -0.200847, 50.825571, -0.187975, 50.825472, -0.187103, 50.825287, -0.184569,
                    50.82531, -0.184396, 50.82518, -0.182964, 50.825187, -0.182856, 50.825172, -0.182718,
                    50.825118, -0.182578, 50.824866, -0.181219, 50.824769, -0.181194, 50.824629, -0.180184,
                    50.824498, -0.179134, 50.824399, -0.178097, 50.824398, -0.177835, 50.824138, -0.175184
                ),
            ),
        ),
    )

    private fun points(vararg latLon: Double): List<GeoPoint> = latLon.toList().chunked(2) { GeoPoint(it[0], it[1]) }
}
