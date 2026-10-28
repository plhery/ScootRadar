package com.plhery.scootradar

import com.plhery.scootradar.core.generated.ScooterProvider.Bird
import com.plhery.scootradar.core.generated.ScooterProvider.Bolt
import com.plhery.scootradar.core.generated.ScooterProvider.Dott
import com.plhery.scootradar.core.generated.ScooterProvider.Hopp
import com.plhery.scootradar.core.generated.ScooterProvider.Lime
import com.plhery.scootradar.core.generated.ScooterProvider.Publibike
import com.plhery.scootradar.core.generated.ScooterProvider.Voi
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterCity

// The catalog the screen's tests read: the Swiss towns around Zürich and Lungern, as data/ had them on 28 October
// 2026, as :core's tests have theirs (TestCatalog.kt there). The Markets lane changes data/ every day; this stays as
// it is, so that a town added near Zürich or Lungern leaves the dock's chips, closest cities and baselines as they
// were recorded (LOG-370).

object TestCatalog {
    val zurich = city("ch:zurich", "Zürich", 47.3769, 8.5417, GeoBounds(47.27, 8.34, 47.49, 8.73))

    /** Bern, Wädenswil and Zürich are the closest to Lungern, which no operator serves; the others follow. */
    val bern = city("ch:bern", "Bern", 46.948, 7.4474, GeoBounds(46.82, 7.2, 47.08, 7.7))
    private val wadenswil = city("ch:wadenswil", "Wädenswil", 47.2297, 8.6722, GeoBounds(47.168, 8.62, 47.258, 8.72))
    private val uster = city("ch:uster", "Uster", 47.34, 8.72, GeoBounds(47.25, 8.58, 47.43, 8.86))
    private val opfikon = city("ch:opfikon", "Opfikon", 47.4317, 8.5759, GeoBounds(47.4156, 8.5533, 47.4568, 8.6208))
    private val kloten = city("ch:kloten", "Kloten", 47.4515, 8.5849, GeoBounds(47.4287, 8.5477, 47.4829, 8.6213))

    private val cities = listOf(zurich, bern, wadenswil, uster, opfikon, kloten)

    /** The providers of Switzerland's open data, as each Swiss town has them. */
    private val swissProviders = listOf(Bolt, Bird, Dott, Hopp, Lime, Voi, Publibike)

    val catalog: ScooterCatalog = ScooterCatalog.Listed(
        cities = cities,
        areas = cities.flatMap { city -> swissProviders.map { it to city.bounds } },
    )
}

private fun city(id: String, name: String, latitude: Double, longitude: Double, bounds: GeoBounds) =
    ScooterCity(id = id, name = name, countryCode = "CH", center = GeoPoint(latitude, longitude), bounds = bounds)
