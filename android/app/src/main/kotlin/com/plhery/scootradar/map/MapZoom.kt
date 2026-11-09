package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRect
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScooterClusteringPolicy
import com.plhery.scootradar.core.model.ScooterMapProjection
import org.maplibre.android.constants.MapLibreConstants
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.log2
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.tan

// The coordinator's zoomLevel(on:) and the region regionDidChange reports, from
// ios/ScootRadar/Views/ScooterMapView.swift.

/**
 * The map's zoom as the iPhone counts it, which is the zoom of Leaflet and of the server: the world 256 points
 * wide at zoom 0. MapLibre's world is 512 dp wide at its zoom 0, so its own zoom is one less (MAP-061, MAP-313).
 * Every threshold the map applies, and every zoom it sets, goes through here.
 */
object MapZoom {
    /** How far MapLibre's zoom is below the iPhone's. */
    const val mapLibreOffset: Double = 1.0

    /**
     * The closest the map goes, in MapLibre's zoom: MapKit's, the iPhone's zoom 21, 2 points a point of the flat map,
     * for a pinch, a double tap and a move alike, on every map and style (MAP-301).
     */
    const val maximum: Double = 20.0

    /**
     * The furthest out it goes on a phone, in MapLibre's zoom: MapKit's pinch stops at the iPhone's zoom 2, a world
     * 1024 points wide (MAP-301).
     */
    const val minimum: Double = 1.0

    /**
     * The furthest out a map `width` dp wide goes: on a wider map MapKit's pinch keeps the world at least twice as
     * wide as the map, which on a phone it is already at [minimum] (MAP-301).
     */
    fun minimum(width: Double): Double = max(minimum, log2(width / 256))

    /** The iPhone's zoom at a zoom of MapLibre's camera. */
    fun level(mapLibreZoom: Double): Double = mapLibreZoom + mapLibreOffset

    /** MapLibre's zoom at a zoom of the iPhone's. */
    fun mapLibreZoom(level: Double): Double = level - mapLibreOffset

    /**
     * log2((bounds.width / visibleMapRect.width) × world / 256), as the iPhone measures it; 0 while the map has
     * no width. Flat and north up it is MapLibre's zoom + 1. Tilted or turned, the box around the view's corners
     * is wider than the map is across its middle, so the level is lower than the camera's, as on the iPhone.
     */
    fun level(on: ScooterMapProjection): Double {
        val width = on.bounds.width
        val mapWidth = on.visibleMapRect.width
        if (!(width > 0 && mapWidth > 0)) return 0.0
        return log2(width / mapWidth * MapPoint.worldSize / 256)
    }

    /** The zoom scooters are asked for at a zoom level: its ceiling, from 0 to 22. */
    fun apiZoom(level: Double): Int = ScooterClusteringPolicy.apiZoom(level)

    /**
     * The region of a part of the flat map, as MKCoordinateRegion(_:) gives it: centred on the rect's middle
     * point, from its top edge's latitude to its bottom edge's, and as many degrees across as it is wide.
     */
    fun region(of: MapRect): MapRegion {
        val top = MapPoint(of.midX, max(0.0, of.minY)).coordinate.latitude
        val bottom = MapPoint(of.midX, min(MapPoint.worldSize, of.maxY)).coordinate.latitude
        return MapRegion(
            center = MapPoint(of.midX, of.midY).coordinate,
            latitudeDelta = top - bottom,
            longitudeDelta = min(360.0, of.width / MapPoint.worldSize * 360),
        )
    }

    /**
     * MapLibre's zoom at which a region fits a frame of `width` by `height` dp, as MKMapView.setRegion fits
     * it: the whole region shown, with more of the map along the side it leaves.
     */
    fun fitting(region: MapRegion, width: Double, height: Double): Double {
        val north = MapPoint(GeoPoint(min(90.0, region.center.latitude + region.latitudeDelta / 2), 0.0))
        val south = MapPoint(GeoPoint(max(-90.0, region.center.latitude - region.latitudeDelta / 2), 0.0))
        val across = region.longitudeDelta / 360 * MapPoint.worldSize
        val perPoint = max(across / width, (south.y - north.y) / height)
        return min(maximum, max(minimum, log2(MapPoint.worldSize / (512 * perPoint))))
    }

    /** The metres a dp of the flat map covers at MapLibre's `zoom`, where the map looks at `latitude`. */
    fun metresPerPoint(zoom: Double, latitude: Double): Double =
        2 * PI * 6_378_137.0 * cos(latitude * PI / 180) / (512 * 2.0.pow(zoom))

    /**
     * How far MapKit's camera stands from the point it looks at, its centerCoordinateDistance, in heights of the map
     * it shows: its field of view is 30° from the map's top edge to its bottom one, so 1 / (2 tan 15°) heights. MapKit
     * doesn't say; it was measured on the iOS 27 simulator, the same on maps 478 to 1912 points tall and 220 to 1032
     * wide (tools/mapkit-probe/FINDINGS.md, MAP-301).
     */
    val mapKitHeights: Double = 1 / (2 * tan(PI / 12))

    /** How far MapKit's camera would stand from what it looks at, in metres, to show a map `height` dp tall at `zoom`. */
    fun mapKitDistance(zoom: Double, latitude: Double, height: Double): Double =
        mapKitHeights * height * metresPerPoint(zoom, latitude)

    /**
     * MapLibre's zoom at which the map shows what MapKit's camera shows from `distance` metres away, on a map
     * `height` dp tall (MAP-005).
     */
    fun atDistance(distance: Double, latitude: Double, height: Double): Double {
        val metresPerPoint = distance / (mapKitHeights * height)
        val circumference = 2 * PI * 6_378_137.0 * cos(latitude * PI / 180)
        return min(maximum, max(minimum, log2(circumference / (512 * metresPerPoint))))
    }

    /**
     * The most MapKit tilts its camera at MapLibre's `zoom` (MAP-322): 75° from the iPhone's zoom 19, 70° from 17,
     * 60° from 16 and 35° further out, at every latitude and on every map. MapKit doesn't say; the edges were found
     * on the iOS 27 simulator.
     */
    fun mapKitMostTilt(zoom: Double): Double = when {
        zoom >= 18.0 -> 75.0
        zoom >= 16.0 -> 70.0
        zoom >= 15.0 -> 60.0
        else -> 35.0
    }

    /** The most the map tilts at `zoom`: MapKit's, where MapLibre goes that far, which is 60° at most. */
    fun mostTilt(zoom: Double): Double = min(mapKitMostTilt(zoom), MapLibreConstants.MAXIMUM_TILT)
}
