package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRect
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScooterClusteringPolicy
import com.plhery.scootradar.core.model.ScooterMapProjection
import kotlin.math.log2
import kotlin.math.max
import kotlin.math.min

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
}
