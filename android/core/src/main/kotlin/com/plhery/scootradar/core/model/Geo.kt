package com.plhery.scootradar.core.model

import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

// Equality here is Swift's: 0.0 and -0.0 are the same coordinate, which a data class's equals would
// tell apart.

class GeoPoint(val latitude: Double, val longitude: Double) {
    override fun equals(other: Any?): Boolean =
        other is GeoPoint && latitude == other.latitude && longitude == other.longitude

    override fun hashCode(): Int = 31 * (latitude + 0.0).hashCode() + (longitude + 0.0).hashCode()

    override fun toString(): String = "GeoPoint(latitude=$latitude, longitude=$longitude)"
}

/** What the map shows, as MapKit's MKCoordinateRegion gives it: a centre and spans in degrees. */
data class MapRegion(val center: GeoPoint, val latitudeDelta: Double, val longitudeDelta: Double) {
    companion object {
        /**
         * MKCoordinateRegion(center:latitudinalMeters:longitudinalMeters:): the spans that cover so many
         * metres north to south and east to west at the centre, on the WGS 84 ellipsoid as MapKit
         * measures them: to a millionth of a degree over a city, and within a metre up to 2,000 km.
         */
        fun around(center: GeoPoint, latitudinalMeters: Double, longitudinalMeters: Double): MapRegion {
            val latitude = center.latitude * PI / 180
            val squaredEccentricity = FLATTENING * (2 - FLATTENING)
            val curve = 1 - squaredEccentricity * sin(latitude).pow(2)
            // The radii of the ellipsoid's curve along the meridian and along the parallel.
            val meridian = EQUATORIAL_RADIUS * (1 - squaredEccentricity) / curve.pow(1.5)
            val parallel = EQUATORIAL_RADIUS / sqrt(curve) * cos(latitude)
            return MapRegion(
                center = center,
                latitudeDelta = latitudinalMeters / (meridian * PI / 180),
                longitudeDelta = longitudinalMeters / (parallel * PI / 180),
            )
        }

        private const val EQUATORIAL_RADIUS = 6_378_137.0
        private const val FLATTENING = 1 / 298.257223563
    }
}

/**
 * A box of the map, like `MapBounds` in src/lib/types.ts. A west greater than the east crosses the 180°
 * line, as in GeoJSON: the box runs from its west to 180° and on from -180° to its east, as a view of
 * New Zealand and the Chatham Islands does. A box from -180 to 180 goes all the way round.
 */
class GeoBounds(val south: Double, val west: Double, val north: Double, val east: Double) {
    /** Whether the box runs across the 180° line. */
    val crossesDateLine: Boolean get() = west > east

    /** How many degrees of longitude the box spans, 360 at most. */
    val longitudeSpan: Double get() = if (crossesDateLine) east - west + 360 else east - west

    /** The box's longitudes as one or two ranges that keep to -180...180. */
    private val longitudeRanges: List<ClosedFloatingPointRange<Double>>
        get() = if (crossesDateLine) {
            listOf(swiftMin(west, 180.0)..180.0, -180.0..swiftMax(east, -180.0))
        } else {
            listOf(west..east)
        }

    fun intersects(other: GeoBounds): Boolean {
        if (!(south <= other.north && north >= other.south)) return false
        // Both cross the line, so both hold it.
        if (crossesDateLine && other.crossesDateLine) return true
        return longitudeRanges.any { range ->
            other.longitudeRanges.any { range.start <= it.endInclusive && it.start <= range.endInclusive }
        }
    }

    fun contains(other: GeoBounds): Boolean {
        if (!(other.south >= south && other.north <= north)) return false
        if (longitudeSpan >= 360) return true
        // Within one of this box's ranges: across the line only if this box crosses it too.
        if (other.crossesDateLine) {
            return crossesDateLine && other.west >= west && other.east <= east
        }
        return longitudeRanges.any { other.west in it && other.east in it }
    }

    fun contains(latitude: Double, longitude: Double): Boolean {
        if (!(latitude >= south && latitude <= north)) return false
        return if (crossesDateLine) longitude >= west || longitude <= east else longitude >= west && longitude <= east
    }

    fun contains(point: GeoPoint): Boolean = contains(point.latitude, point.longitude)

    /** The middle of the box, on the right side of the 180° line. */
    val center: GeoPoint
        get() = GeoPoint(
            latitude = (south + north) / 2,
            longitude = if (crossesDateLine) wrapped(west + longitudeSpan / 2) else (west + east) / 2,
        )

    /** Larger by the ratio of its size on each side; one that would go round the world is all of it. */
    fun expanded(by: Double): GeoBounds {
        val latitudePadding = (north - south) * by
        val longitudePadding = longitudeSpan * by
        val round = longitudeSpan + 2 * longitudePadding >= 360
        return GeoBounds(
            south = swiftMax(-90.0, south - latitudePadding),
            west = if (round) -180.0 else wrapped(west - longitudePadding),
            north = swiftMin(90.0, north + latitudePadding),
            east = if (round) 180.0 else wrapped(east + longitudePadding),
        )
    }

    override fun equals(other: Any?): Boolean =
        other is GeoBounds && south == other.south && west == other.west && north == other.north && east == other.east

    override fun hashCode(): Int =
        listOf(south, west, north, east).fold(0) { hash, value -> 31 * hash + (value + 0.0).hashCode() }

    override fun toString(): String = "GeoBounds(south=$south, west=$west, north=$north, east=$east)"

    companion object {
        /**
         * The region the map shows. Its centre is between -180° and 180° and its edges may run past them:
         * such a view crosses the line, and one wider than the world is all of it.
         */
        operator fun invoke(region: MapRegion): GeoBounds {
            val halfLatitude = region.latitudeDelta / 2
            val halfLongitude = region.longitudeDelta / 2
            val (west, east) = longitudes(
                west = region.center.longitude - halfLongitude,
                east = region.center.longitude + halfLongitude,
            )
            return GeoBounds(
                south = swiftMax(-90.0, region.center.latitude - halfLatitude),
                west = west,
                north = swiftMin(90.0, region.center.latitude + halfLatitude),
                east = east,
            )
        }

        /** Longitudes that run from west to east past ±180°, brought back between them. */
        private fun longitudes(west: Double, east: Double): Pair<Double, Double> {
            if (east - west >= 360) return -180.0 to 180.0
            var wrappedWest = wrapped(west)
            var wrappedEast = wrapped(east)
            // An edge on the line itself is on the side of the rest of the box.
            if (wrappedWest == 180.0 && wrappedEast < 180) wrappedWest = -180.0
            if (wrappedEast == -180.0 && wrappedWest > -180) wrappedEast = 180.0
            return wrappedWest to wrappedEast
        }

        /** The longitude in -180...180; one already there is kept as it is, 180 included. */
        fun wrapped(longitude: Double): Double {
            if (longitude >= -180 && longitude <= 180) return longitude
            val turned = (longitude + 180) % 360
            return (if (turned < 0) turned + 360 else turned) - 180
        }
    }
}
