package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterScreenshotCamera
import org.junit.Assert.assertEquals
import org.junit.Test
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import kotlin.math.abs

class MapCameraTest {
    @Test
    fun theMapOpensOnTheStartRegionAsMapKitFitsItTilted() {
        val start = ScooterMapStart.switzerland
        val opening = MapCamera.opening(start)

        assertEquals(start.region.center.latitude, opening.target!!.latitude, 0.0)
        assertEquals(start.region.center.longitude, opening.target!!.longitude, 0.0)
        assertEquals(MapZoom.fitting(start.region, width = 390.0, height = 844.0), opening.zoom, 0.0)
        assertEquals(20.0, opening.tilt, 0.0)
        assertEquals(0.0, opening.bearing, 0.0)
    }

    @Test
    fun aScreenshotCameraTakesThePlaceOfTheStart() {
        val camera = ScooterScreenshotCamera.Camera(GeoPoint(47.3769, 8.5417), distance = 900.0, pitch = 45.0, heading = 30.0)
        val opening = MapCamera.opening(ScooterMapStart.switzerland, camera)

        assertEquals(47.3769, opening.target!!.latitude, 0.0)
        assertEquals(8.5417, opening.target!!.longitude, 0.0)
        assertEquals(MapZoom.atDistance(900.0, latitude = 47.3769, height = 844.0), opening.zoom, 0.0)
        assertEquals(45.0, opening.tilt, 0.0)
        assertEquals(30.0, opening.bearing, 0.0)
    }

    @Test
    fun aMoveGoesStraightAcrossTheFlatMapAndTurnsTheShortWay() {
        val from = position(47.0, 8.0, zoom = 12.0, tilt = 20.0, bearing = 350.0)
        val to = position(48.0, 9.0, zoom = 14.0, tilt = 40.0, bearing = 10.0)

        val halfway = MapCamera.between(from, to, 0.5)
        val middle = MapPoint(
            (MapPoint(GeoPoint(47.0, 8.0)).x + MapPoint(GeoPoint(48.0, 9.0)).x) / 2,
            (MapPoint(GeoPoint(47.0, 8.0)).y + MapPoint(GeoPoint(48.0, 9.0)).y) / 2,
        ).coordinate
        assertEquals(middle.latitude, halfway.target!!.latitude, 1e-9)
        assertEquals(middle.longitude, halfway.target!!.longitude, 1e-9)
        // The camera's distance halfway, not the zoom: past 13, as MapKit's comes in.
        val distance = (MapZoom.mapKitDistance(12.0, 47.0, 844.0) + MapZoom.mapKitDistance(14.0, 48.0, 844.0)) / 2
        assertEquals(MapZoom.atDistance(distance, middle.latitude, 844.0), halfway.zoom, 1e-9)
        assertEquals(12.67, halfway.zoom, 0.01)
        assertEquals(30.0, halfway.tilt, 1e-9)
        assertEquals(0.0, halfway.bearing % 360, 1e-9)

        val there = MapCamera.between(from, to, 1.0)
        assertEquals(48.0, there.target!!.latitude, 1e-9)
        assertEquals(9.0, there.target!!.longitude, 1e-9)
        assertEquals(14.0, there.zoom, 1e-9)
    }

    @Test
    fun aMoveTakesAQuarterOfASecondForEachZoomLevelBegun() {
        // As MapKit's moves in and out took on the iOS 27 simulator.
        val from = position(47.3769, 8.5417, zoom = 15.0, tilt = 20.0)
        fun zoomedBy(levels: Double) = MapCamera.moveMillis(from, position(47.3769, 8.5417, zoom = 15.0 + levels, tilt = 20.0), 956.0)
        assertEquals(250, zoomedBy(0.0))
        assertEquals(250, zoomedBy(0.9))
        assertEquals(250, zoomedBy(1.0))
        assertEquals(500, zoomedBy(1.05))
        assertEquals(500, zoomedBy(-2.0))
        assertEquals(750, zoomedBy(2.05))
        assertEquals(1750, zoomedBy(-7.0))
        assertEquals(2000, zoomedBy(-7.5))
        assertEquals(2000, zoomedBy(-12.0))
    }

    @Test
    fun aMoveTakesAQuarterOfASecondForEachHeightOfTheCameraItCrosses() {
        // MapKit's camera 1200 m above Zürich on the iPhone, moved east: 3.23 km took 0.70 s flat, 0.75 s at 20°
        // and 0.98 s at 45°, and 9 km 1.90 s, each with some 30 ms before the first frame.
        val zoom = MapZoom.atDistance(1200.0, latitude = 47.3769, height = 956.0)
        fun east(km: Double, tilt: Double): Int {
            val longitude = 8.5417 + km / (111.32 * kotlin.math.cos(47.3769 * Math.PI / 180))
            return MapCamera.moveMillis(
                position(47.3769, 8.5417, zoom = zoom, tilt = tilt),
                position(47.3769, longitude, zoom = zoom, tilt = tilt),
                956.0,
            )
        }
        assertEquals(670.0, east(3.228, tilt = 0.0).toDouble(), 10.0)
        assertEquals(715.0, east(3.228, tilt = 20.0).toDouble(), 10.0)
        assertEquals(950.0, east(3.228, tilt = 45.0).toDouble(), 10.0)
        assertEquals(1870.0, east(9.0, tilt = 0.0).toDouble(), 10.0)
        // A short move still takes a quarter of a second, a long one two seconds.
        assertEquals(250, east(0.5, tilt = 0.0))
        assertEquals(2000, east(40.0, tilt = 0.0))
        // The longer of the two: one level in over 3.23 km is the ground's time at the closer camera.
        val closer = MapCamera.moveMillis(
            position(47.3769, 8.5417, zoom = zoom - 1, tilt = 0.0),
            position(47.3769, 8.5417 + 3.228 / (111.32 * kotlin.math.cos(47.3769 * Math.PI / 180)), zoom = zoom, tilt = 0.0),
            956.0,
        )
        assertEquals(670.0, closer.toDouble(), 10.0)
    }

    @Test
    fun aMoveAcrossTheAntimeridianGoesTheShortWay() {
        val halfway = MapCamera.between(position(0.0, 179.0), position(0.0, -179.0), 0.5)

        assertEquals(180.0, abs(halfway.target!!.longitude), 1e-9)
    }

    private fun position(latitude: Double, longitude: Double, zoom: Double = 10.0, tilt: Double = 0.0, bearing: Double = 0.0) =
        CameraPosition.Builder().target(LatLng(latitude, longitude)).zoom(zoom).tilt(tilt).bearing(bearing).build()
}
