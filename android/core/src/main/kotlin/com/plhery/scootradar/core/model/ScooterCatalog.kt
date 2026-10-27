package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import kotlin.math.PI
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

// The catalog the iPhone app has in ProviderCatalog.generated.swift, read from the generated
// catalog.json (CatalogData) the first time it is used, as Swift's static lets are.

data class ScooterCity(
    val id: String,
    val name: String,
    /** CH, FR, DE, IT, BE, NO, GB… */
    val countryCode: String,
    val center: GeoPoint,
    val bounds: GeoBounds,
    /** The seasonal pauses of its service areas when every one has one, like pauses on the web. */
    val pauses: List<ScooterSeasonalPause> = emptyList(),
    /**
     * The feeds of its service areas, each with the area's pause: it is off season once their operators
     * have all closed its season or are in their pause, as closedForSeason on the web.
     */
    val feeds: List<ScooterCityFeed> = emptyList(),
)

/** A feed with a service area in a city, by the id meta.seasonOver names it with. */
data class ScooterCityFeed(
    /** "kazakhstan:whoosh_kz_nqz": the country's source, then the system's id. */
    val id: String,
    /** The seasonal pause of its service area there, if it has one. */
    val pause: ScooterSeasonalPause? = null,
)

/**
 * The part of the year a city has no scooters, as Montréal each winter, like src/lib/seasonalPauses.ts.
 */
data class ScooterSeasonalPause(
    /** Local "MM-DD": the first day without scooters. */
    val from: String,
    /** Local "MM-DD": the first day they are back; or "clear", once the streets are clear of snow and ice. */
    val until: String,
    /** The IANA time zone the dates are in. */
    val timeZone: String,
)

data class ScooterCityDistance(val city: ScooterCity, val distanceMeters: Double) {
    val id: String get() = city.id
}

/** Every city with scooter data, one entry per city, like COVERED_CITIES on the web. */
object ScooterCityCatalog {
    val cities: List<ScooterCity> get() = CatalogData.value.cities

    /**
     * How many cities the app covers, and in how many countries, for the card outside coverage, as
     * COVERED_CITY_TOTAL and COVERED_COUNTRY_TOTAL count them on the web.
     */
    val cityCount: Int get() = cities.size
    val countryCount: Int get() = CatalogData.value.countryCount

    /** Cities by distance from the point to their centre, nearest first. */
    fun nearest(to: GeoPoint, count: Int): List<ScooterCityDistance> =
        cities.map { ScooterCityDistance(it, distanceMeters(to, it.center)) }
            .sortedBy { it.distanceMeters }
            .take(maxOf(0, count))

    /** Whether the point is inside an operator's service area, like isPointCovered on the web. */
    fun contains(latitude: Double, longitude: Double): Boolean = ScooterProviderCoverage.contains(latitude, longitude)

    fun contains(point: GeoPoint): Boolean = contains(point.latitude, point.longitude)

    // haversineM from src/lib/geo.ts, so both apps show the same distances.
    internal fun distanceMeters(origin: GeoPoint, destination: GeoPoint): Double {
        val radians = PI / 180
        val latitudeDelta = (destination.latitude - origin.latitude) * radians
        val longitudeDelta = (destination.longitude - origin.longitude) * radians
        val a = sin(latitudeDelta / 2).pow(2) +
            cos(origin.latitude * radians) * cos(destination.latitude * radians) * sin(longitudeDelta / 2).pow(2)
        return 2 * 6_371_000 * asin(min(1.0, sqrt(a)))
    }
}

object ScooterProviderCoverage {
    /** The providers the Swiss open data names; the others run scooters only abroad. */
    val swissProviders: List<ScooterProvider> get() = ScooterProvider.swissProviders

    fun providers(viewport: GeoBounds): List<ScooterProvider> {
        val data = CatalogData.value
        val available = mutableSetOf<ScooterProvider>()
        if (data.swissAreas.any { it.intersects(viewport) }) available += swissProviders
        for ((provider, bounds) in data.regionalSystems) {
            if (bounds.intersects(viewport)) available += provider
        }
        return ScooterProvider.entries.filter { it in available }
    }

    fun contains(latitude: Double, longitude: Double): Boolean {
        val data = CatalogData.value
        return data.swissAreas.any { it.contains(latitude, longitude) } ||
            data.regionalSystems.any { it.second.contains(latitude, longitude) }
    }
}

/**
 * A city's ban on renting shared scooters at night, like src/lib/rentalCurfews.ts. `all` is generated
 * from data/rental-curfews.json.
 */
data class RentalCurfew(
    val city: String,
    val timeZone: String,
    val nights: List<Night>,
    /** The municipality's boundary, one ring a piece. */
    val areas: List<List<GeoPoint>>,
) {
    /**
     * One window of the ban. A night belongs to the evening it starts on: a window that starts before noon
     * is the early hours after that evening.
     */
    data class Night(
        /** Weekdays of those evenings, 1 for Sunday as Apple's Calendar counts them; every evening when null. */
        val evenings: Set<Int>?,
        /** Local minutes since midnight; a window past midnight starts after it ends. */
        val fromMinute: Int,
        val untilMinute: Int,
    )

    companion object {
        val all: List<RentalCurfew> get() = CatalogData.value.curfews
    }
}

/** The countries of data/countries.json, as src/generated/countries.ts has them on the web. */
object ScooterCountryCatalog {
    /** Where a country's total stands, zoomed out: inland and about the middle of the country. */
    val anchors: Map<String, GeoPoint> get() = CatalogData.value.anchors

    /** The countries' own credits, after Switzerland's and France's: their GBFS feeds, then their licences. */
    val credits: List<Pair<String, String>> get() = CatalogData.value.credits

    /** The countries whose totals, zoomed out, are their states' or provinces', and those by code. */
    val regionTotals: Map<String, Map<String, ScooterRegion>> get() = CatalogData.value.regionTotals
}

/** A state or province whose total stands apart, zoomed out. */
data class ScooterRegion(
    val name: String,
    /** Its name where a language of the app writes it otherwise: "Colombie-Britannique". */
    val names: Map<String, String> = emptyMap(),
    val latitude: Double,
    val longitude: Double,
)
