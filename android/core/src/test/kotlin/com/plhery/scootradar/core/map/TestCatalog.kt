package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.generated.ScooterProvider.Bird
import com.plhery.scootradar.core.generated.ScooterProvider.Bolt
import com.plhery.scootradar.core.generated.ScooterProvider.Dott
import com.plhery.scootradar.core.generated.ScooterProvider.Hopp
import com.plhery.scootradar.core.generated.ScooterProvider.Jet
import com.plhery.scootradar.core.generated.ScooterProvider.Lime
import com.plhery.scootradar.core.generated.ScooterProvider.Publibike
import com.plhery.scootradar.core.generated.ScooterProvider.Ryde
import com.plhery.scootradar.core.generated.ScooterProvider.Voi
import com.plhery.scootradar.core.generated.ScooterProvider.Whoosh
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.RentalCurfew
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterCity
import com.plhery.scootradar.core.model.ScooterCityFeed
import com.plhery.scootradar.core.model.ScooterSeasonalPause

// The catalog the controller's tests read: a few of the generated catalog's cities, service areas, night bans and
// street rules, as data/ had them on 28 October 2026. The Markets lane changes data/ every day; this stays as it
// is, so that a city added near Zürich, a town paused or an area moved leaves the tests' cities, providers and
// distances what they say (LOG-370).

internal object TestCatalog {
    /** Bern, Wädenswil and Zürich are the closest to Lungern, which no operator serves; the six around Switzerland's centre follow. */
    val zurich = city("ch:zurich", "Zürich", "CH", 47.3769, 8.5417, GeoBounds(47.27, 8.34, 47.49, 8.73))
    val bern = city("ch:bern", "Bern", "CH", 46.948, 7.4474, GeoBounds(46.82, 7.2, 47.08, 7.7))
    val wadenswil = city("ch:wadenswil", "Wädenswil", "CH", 47.2297, 8.6722, GeoBounds(47.168, 8.62, 47.258, 8.72))
    val uster = city("ch:uster", "Uster", "CH", 47.34, 8.72, GeoBounds(47.25, 8.58, 47.43, 8.86))
    val opfikon = city("ch:opfikon", "Opfikon", "CH", 47.4317, 8.5759, GeoBounds(47.4156, 8.5533, 47.4568, 8.6208))
    val kloten = city("ch:kloten", "Kloten", "CH", 47.4515, 8.5849, GeoBounds(47.4287, 8.5477, 47.4829, 8.6213))
    val locarno = city("ch:locarno", "Locarno", "CH", 46.169, 8.799, GeoBounds(46.1, 8.67, 46.25, 8.9))

    private val swissCities = listOf(zurich, bern, wadenswil, uster, opfikon, kloten, locarno)

    /** The providers of Switzerland's open data, as each Swiss town has them. */
    val swissProviders = listOf(Bolt, Bird, Dott, Hopp, Lime, Voi, Publibike)

    private val berlin = city("de:Berlin", "Berlin", "DE", 52.52, 13.405, GeoBounds(52.1367, 12.6012, 52.9019, 13.9059))
    private val rome = city("it:Roma", "Roma", "IT", 41.9028, 12.4964, GeoBounds(41.6884, 12.2183, 42.0928, 12.7268))
    private val lyon = city("fr:Lyon", "Lyon", "FR", 45.7578, 4.832, GeoBounds(45.7065, 4.757, 45.8489, 4.9294))

    /** Oslo bans renting every night from 23:00 to 05:00. */
    private val oslo = city(
        "no:Oslo", "Oslo", "NO", 59.9109, 10.7528, GeoBounds(59.8134, 10.6158, 59.9871, 10.9574),
        feeds = listOf("norway:bolt_no_oslo", "norway:ryde_no_oslo", "norway:voi_no_oslo").map { ScooterCityFeed(it) },
    )

    /** Skien's scooters are away from 15 December until the streets are clear. */
    private val skienPause = ScooterSeasonalPause(from = "12-15", until = "clear", timeZone = "Europe/Oslo")
    private val skien = city(
        "no:Skien", "Skien", "NO", 59.2075, 9.6107, GeoBounds(59.1385, 9.52, 59.2656, 9.6801),
        pauses = listOf(skienPause), feeds = listOf(ScooterCityFeed("norway:ryde_no_skien", skienPause)),
    )

    /** Whoosh's towns: alone in Astana and Zapopan, beside Jet and Bolt in Almaty. */
    private val astana = city(
        "kz:Astana", "Astana", "KZ", 51.143975, 71.43581, GeoBounds(51.06534, 71.3469, 51.20139, 71.54021),
        feeds = listOf(ScooterCityFeed("kazakhstan:whoosh_kz_nqz")),
    )
    private val zapopan = city(
        "mx:Zapopan", "Zapopan", "MX", 20.721331, -103.391882, GeoBounds(20.63267, -103.44679, 20.74174, -103.37085),
        feeds = listOf(ScooterCityFeed("mexico:whoosh_mx_zap")),
    )
    private val almaty = city(
        "kz:Almaty", "Almaty", "KZ", 43.298812, 76.939435, GeoBounds(43.1775, 76.774937, 43.356878, 77.013148),
        feeds = listOf("kazakhstan:jet_kz_almaty", "kazakhstan:whoosh_kz_ala", "kazakhstan:bolt_kz_app_122").map { ScooterCityFeed(it) },
    )

    /** Seoul forbids scooters on Hongdae's red road from noon until 23:00. */
    private val hongdaeRedRoad = CityRuleZone(
        id = "seoul-hongdae-red-road",
        authority = "Seoul",
        timeZone = "Asia/Seoul",
        firstDay = "2025-05-16",
        hours = listOf(CityRuleZone.Hours(fromMinute = 12 * 60, untilMinute = 23 * 60)),
        source = "https://news.seoul.go.kr/traffic/archives/514266",
        lines = listOf(listOf(GeoPoint(37.555766, 126.927544), GeoPoint(37.555763, 126.927014), GeoPoint(37.555734, 126.926735))),
    )

    val catalog: ScooterCatalog = ScooterCatalog.Listed(
        cities = swissCities + listOf(berlin, rome, lyon, oslo, skien, astana, zapopan, almaty),
        areas = swissCities.flatMap { city -> swissProviders.map { it to city.bounds } } +
            listOf(Bolt, Dott, Lime, Voi).map { it to berlin.bounds } +
            listOf(Bird, Dott, Lime).map { it to rome.bounds } +
            listOf(Dott to lyon.bounds) +
            listOf(Bolt, Voi, Ryde).map { it to oslo.bounds } +
            listOf(Ryde to skien.bounds, Whoosh to astana.bounds, Whoosh to zapopan.bounds) +
            listOf(Bolt, Jet).map { it to almaty.bounds },
        curfews = listOf(
            RentalCurfew(
                city = "Oslo",
                timeZone = "Europe/Oslo",
                nights = listOf(RentalCurfew.Night(evenings = null, fromMinute = 23 * 60, untilMinute = 5 * 60)),
                areas = listOf(ring(oslo.bounds)),
            ),
        ),
        ruleZones = listOf(hongdaeRedRoad),
    )
}

private fun city(
    id: String,
    name: String,
    countryCode: String,
    latitude: Double,
    longitude: Double,
    bounds: GeoBounds,
    pauses: List<ScooterSeasonalPause> = emptyList(),
    feeds: List<ScooterCityFeed> = emptyList(),
) = ScooterCity(id, name, countryCode, GeoPoint(latitude, longitude), bounds, pauses, feeds)

/** The box as a ring of its corners. */
private fun ring(bounds: GeoBounds): List<GeoPoint> = listOf(
    GeoPoint(bounds.south, bounds.west), GeoPoint(bounds.south, bounds.east),
    GeoPoint(bounds.north, bounds.east), GeoPoint(bounds.north, bounds.west),
)
