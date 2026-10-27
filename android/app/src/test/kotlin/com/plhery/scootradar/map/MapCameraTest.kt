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
        assertEquals(13.0, halfway.zoom, 1e-9)
        assertEquals(30.0, halfway.tilt, 1e-9)
        assertEquals(0.0, halfway.bearing % 360, 1e-9)

        val there = MapCamera.between(from, to, 1.0)
        assertEquals(48.0, there.target!!.latitude, 1e-9)
        assertEquals(9.0, there.target!!.longitude, 1e-9)
        assertEquals(14.0, there.zoom, 1e-9)
    }

    @Test
    fun aMoveAcrossTheAntimeridianGoesTheShortWay() {
        val halfway = MapCamera.between(position(0.0, 179.0), position(0.0, -179.0), 0.5)

        assertEquals(180.0, abs(halfway.target!!.longitude), 1e-9)
    }

    private fun position(latitude: Double, longitude: Double, zoom: Double = 10.0, tilt: Double = 0.0, bearing: Double = 0.0) =
        CameraPosition.Builder().target(LatLng(latitude, longitude)).zoom(zoom).tilt(tilt).bearing(bearing).build()
}
