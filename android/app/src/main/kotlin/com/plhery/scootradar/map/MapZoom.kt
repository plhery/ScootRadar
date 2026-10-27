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

    /** The closest the map goes, in MapLibre's zoom: the web ground's 22 (MAP-075, MAP-301). */
    const val maximum: Double = 21.0

    /** The furthest out it goes, in MapLibre's zoom. */
    const val minimum: Double = 0.0

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

    /**
     * How many heights of the flat map it shows MapKit's camera stands from the point it looks at, its
     * centerCoordinateDistance. MapKit doesn't say; it was measured on the iOS 27 simulator's iPhone 17 Pro Max,
     * a map 440×956 points. The iPad's, 1032×1376, stands 1.9384 heights away.
     */
    const val mapKitHeights: Double = 2.0494

    /** The metres a dp of the flat map covers at MapLibre's `zoom`, where the map looks at `latitude`. */
    fun metresPerPoint(zoom: Double, latitude: Double): Double =
        2 * PI * 6_378_137.0 * cos(latitude * PI / 180) / (512 * 2.0.pow(zoom))

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
     * The most MapKit tilts its camera at `zoom` (MAP-322): 75° close up, then 70°, 60° and 35° past camera distances
     * of 0.377, 1.508 and 3.017 m for each point of the map's height, the same on the iPhone and the iPad.
     */
    fun mapKitMostTilt(zoom: Double, latitude: Double): Double {
        val perPoint = mapKitHeights * metresPerPoint(zoom, latitude)
        return when {
            perPoint <= 0.3771 -> 75.0
            perPoint <= 1.5084 -> 70.0
            perPoint <= 3.0167 -> 60.0
            else -> 35.0
        }
    }

    /** The most the map tilts at `zoom`: MapKit's, where MapLibre goes that far, which is 60° at most. */
    fun mostTilt(zoom: Double, latitude: Double): Double = min(mapKitMostTilt(zoom, latitude), MapLibreConstants.MAXIMUM_TILT)
}
