package com.plhery.scootradar.map

import android.graphics.PointF
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRect
import com.plhery.scootradar.core.model.ScooterMapProjection
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.MapView
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * ScooterMapProjection on MapLibre. MapKit's points are MapLibre's pixels over its pixel ratio, which is the
 * screen's density unless a test sets its own; coordinates come back with their longitude wrapped to
 * -180…180; and the visible map rect is the north-up box around the view's four corners, past the antimeridian
 * where the view reaches past it.
 */
class MapLibreProjection(private val map: MapLibreMap, private val view: MapView) : ScooterMapProjection {
    private val density: Double get() = view.pixelRatio.toDouble()

    override val bounds: ScreenRect
        get() = ScreenRect(0.0, 0.0, view.width / density, view.height / density)

    override val centerCoordinate: GeoPoint
        get() = map.cameraPosition.target!!.wrap().let { GeoPoint(it.latitude, it.longitude) }

    override val visibleMapRect: MapRect
        get() {
            // The whole view, whatever its padding: MapKit's visibleMapRect ignores the layout margins.
            val region = map.projection.getVisibleRegion(true)
            val centre = map.cameraPosition.target!!.longitude
            val corners = listOf(region.farLeft, region.farRight, region.nearLeft, region.nearRight).map { corner ->
                val latLng = corner!!
                // Each corner on the same turn of the world as the centre, so that a box across the antimeridian
                // runs past the world's edge rather than round the whole world.
                val longitude = latLng.longitude + 360.0 * ((centre - latLng.longitude) / 360.0).roundToInt()
                val y = MapPoint(GeoPoint(latLng.latitude, 0.0)).y
                MapPoint((longitude + 180) / 360 * MapPoint.worldSize, y)
            }
            val minX = corners.minOf { it.x }
            val minY = corners.minOf { it.y }
            return MapRect(minX, minY, corners.maxOf { it.x } - minX, corners.maxOf { it.y } - minY)
        }

    override fun point(coordinate: GeoPoint): ScreenPoint {
        // The copy of the coordinate on the centre's turn of the world, as MapKit shows it.
        val centre = map.cameraPosition.target!!.longitude
        val longitude = coordinate.longitude + 360.0 * ((centre - coordinate.longitude) / 360.0).roundToInt()
        val pixel = map.projection.toScreenLocation(LatLng(coordinate.latitude, longitude))
        return ScreenPoint(pixel.x / density, pixel.y / density)
    }

    /**
     * Where the map shows each of the coordinates, as [point] does, from one call to MapLibre for them all: the
     * clusters are placed against the chrome at every frame of a move.
     */
    fun points(coordinates: List<GeoPoint>): List<ScreenPoint> {
        if (coordinates.isEmpty()) return emptyList()
        val centre = map.cameraPosition.target!!.longitude
        val latLngs = DoubleArray(coordinates.size * 2)
        for ((index, coordinate) in coordinates.withIndex()) {
            latLngs[2 * index] = coordinate.latitude
            latLngs[2 * index + 1] = coordinate.longitude + 360.0 * ((centre - coordinate.longitude) / 360.0).roundToInt()
        }
        val pixels = DoubleArray(latLngs.size)
        map.projection.toScreenLocations(latLngs, pixels)
        val density = density
        return List(coordinates.size) { ScreenPoint(pixels[2 * it] / density, pixels[2 * it + 1] / density) }
    }

    override fun coordinate(point: ScreenPoint): GeoPoint {
        val latLng = map.projection.fromScreenLocation(PointF((point.x * density).toFloat(), (point.y * density).toFloat()))
        val wrapped = latLng.wrap()
        return GeoPoint(max(-90.0, min(90.0, wrapped.latitude)), wrapped.longitude)
    }
}
