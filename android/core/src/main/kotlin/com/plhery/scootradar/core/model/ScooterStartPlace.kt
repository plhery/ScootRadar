package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterTimeZonePlace
import com.plhery.scootradar.core.generated.ScooterTimeZones

// ios/ScootRadar/Models/ScooterStartPlace.swift.

/**
 * Where the map opens when it may not use the phone's location: the covered city nearest the main place
 * of the phone's time zone, framed as a city total frames it when tapped, as on the web
 * (src/lib/startPlace.ts). The zone says roughly where the rider is without asking anyone, and nothing
 * leaves the phone. A zone the table does not know, such as UTC, or with no covered city near, opens on
 * Switzerland, as before. scripts/generate-time-zones.mjs makes the table, TimeZones.kt.
 */
object ScooterStartPlace {
    /** How far across a border a zone may open when its own country has no covered city: Europe/Monaco on Nice. */
    const val neighbourReachMeters: Double = 150_000.0

    /**
     * The covered city nearest the zone's main place in the zone's country (Europe/Berlin opens on Berlin,
     * America/Chicago on the US city nearest Chicago), or within 150 km of it when the country has none.
     */
    fun city(forTimeZone: String, cities: List<ScooterCity> = ScooterCityCatalog.cities): ScooterCity? {
        val zone = zone(forTimeZone) ?: return null
        val distances = cities.map { city -> city to ScooterCityCatalog.distanceMeters(zone.point, city.center) }
        distances.filter { it.first.countryCode == zone.countryCode }.minByOrNull { it.second }?.let { home ->
            return home.first
        }
        val neighbour = distances.minByOrNull { it.second }
        if (neighbour == null || !(neighbour.second <= neighbourReachMeters)) return null
        return neighbour.first
    }

    /**
     * The country of a time zone, "US" for America/Chicago, which the address search sends instead of a map
     * centre so that its places come first; null for a zone the table does not know, such as UTC.
     */
    fun country(forTimeZone: String): String? = zone(forTimeZone)?.countryCode

    private fun zone(identifier: String): ScooterTimeZonePlace? =
        ScooterTimeZones.places[identifier]
            ?: ScooterTimeZones.aliases[identifier]?.let { ScooterTimeZones.places[it] }

    /** The zoom asked for at a city's tapped span on a phone, until the map reports its own. */
    const val cityZoom: Int = 12

    /** Where the map opens: the start city at the span of a tapped city total, or all of Switzerland. */
    fun start(forTimeZone: String, cities: List<ScooterCity> = ScooterCityCatalog.cities): ScooterMapStart {
        val city = city(forTimeZone, cities) ?: return ScooterMapStart.switzerland
        val span = MapFocusRequest.city(city.center, token = 0)
        return ScooterMapStart(
            region = MapRegion.around(
                center = city.center,
                latitudinalMeters = span.latitudinalMeters,
                longitudinalMeters = span.longitudinalMeters,
            ),
            zoom = cityZoom,
        )
    }
}

/** The region the map opens on and the zoom scooters are asked for until the map reports its own. */
data class ScooterMapStart(val region: MapRegion, val zoom: Int) {
    val center: GeoPoint get() = GeoPoint(latitude = region.center.latitude, longitude = region.center.longitude)

    companion object {
        val switzerlandCenter = GeoPoint(latitude = 46.8182, longitude = 8.2275)

        /** All of Switzerland, where every rider opened before. */
        val switzerland = ScooterMapStart(
            region = MapRegion.around(
                center = switzerlandCenter,
                latitudinalMeters = 300_000.0,
                longitudinalMeters = 500_000.0,
            ),
            zoom = 8,
        )
    }
}
