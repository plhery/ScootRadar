package com.plhery.scootradar.core.model

import kotlin.math.PI
import kotlin.math.atan
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sinh

// MKMapPoint and MKMapRect, as MapKit works them out, for what is measured on the flat map.

/**
 * A place on the flat map, in map points: Web Mercator, the world 2²⁸ points wide and tall from its top
 * left corner, x to the east and y to the south.
 */
data class MapPoint(val x: Double, val y: Double) {
    /** The coordinate at the point. A point past the world's east or west edge is one more time round it. */
    val coordinate: GeoPoint
        get() = GeoPoint(
            latitude = atan(sinh(PI * (1 - 2 * y / worldSize))) * 180 / PI,
            longitude = GeoBounds.wrapped(x / worldSize * 360 - 180),
        )

    companion object {
        /** The world's width and height in map points, MKMapSize.world. */
        const val worldSize: Double = 268_435_456.0

        /**
         * The point of a coordinate. The map stops 85° from the equator: a place further north or south is
         * on its edge. What is not a coordinate, a latitude past 90° or a longitude past 180°, is at (-1, -1).
         */
        operator fun invoke(coordinate: GeoPoint): MapPoint {
            val latitude = coordinate.latitude
            val longitude = coordinate.longitude
            if (!(latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180)) return MapPoint(-1.0, -1.0)
            val sine = sin(min(85.0, max(-85.0, latitude)) * PI / 180)
            return MapPoint(
                x = (longitude + 180) / 360 * worldSize,
                y = (0.5 - ln((1 + sine) / (1 - sine)) / (4 * PI)) * worldSize,
            )
        }
    }
}

/** A rectangle of the flat map, in map points, from its top left corner. */
data class MapRect(val x: Double, val y: Double, val width: Double, val height: Double) {
    val minX: Double get() = x
    val midX: Double get() = x + width / 2
    val maxX: Double get() = x + width
    val minY: Double get() = y
    val midY: Double get() = y + height / 2
    val maxY: Double get() = y + height

    /** The rect grown or shrunk by dx on its left and right and dy on its top and bottom, as MKMapRectInset. */
    fun insetBy(dx: Double, dy: Double): MapRect = MapRect(x = x + dx, y = y + dy, width = width - 2 * dx, height = height - 2 * dy)

    /**
     * Whether the two rects overlap, as MKMapRect.intersects: along each axis, the one that starts later, this
     * one on a tie, starts before the other ends. So rects that only touch do not, and a rect of no size on
     * another's top or left edge meets it while the other does not meet it.
     */
    fun intersects(other: MapRect): Boolean =
        (if (minX >= other.minX) minX < other.maxX else other.minX < maxX) &&
            (if (minY >= other.minY) minY < other.maxY else other.minY < maxY)
}
