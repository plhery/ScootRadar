package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterScreenshotCamera
import com.plhery.scootradar.core.model.ScreenRect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import kotlin.math.abs

class MapCameraTest {
    @Test
    fun theMapOpensOnTheStartRegionAsMapKitFitsItTilted() {
        val start = ScooterMapStart.switzerland
        val opening = MapCamera.opening(start, MapKitCamera.IPhone)

        assertEquals(start.region.center.latitude, opening.target!!.latitude, 0.0)
        assertEquals(start.region.center.longitude, opening.target!!.longitude, 0.0)
        assertEquals(MapZoom.fitting(start.region, width = 390.0, height = 844.0), opening.zoom, 0.0)
        assertEquals(20.0, opening.tilt, 0.0)
        assertEquals(0.0, opening.bearing, 0.0)
    }

    @Test
    fun aScreenshotCameraTakesThePlaceOfTheStart() {
        val camera = ScooterScreenshotCamera.Camera(GeoPoint(47.3769, 8.5417), distance = 900.0, pitch = 45.0, heading = 30.0)
        val opening = MapCamera.opening(ScooterMapStart.switzerland, MapKitCamera.IPhone, camera)

        assertEquals(47.3769, opening.target!!.latitude, 0.0)
        assertEquals(8.5417, opening.target!!.longitude, 0.0)
        assertEquals(MapZoom.atDistance(900.0, latitude = 47.3769, height = 844.0, MapKitCamera.IPhone), opening.zoom, 0.0)
        assertEquals(45.0, opening.tilt, 0.0)
        assertEquals(30.0, opening.bearing, 0.0)
        // In an iPad's window MapKit's camera stands closer for the same map, so the same distance shows more.
        val onTheIPad = MapCamera.opening(ScooterMapStart.switzerland, MapKitCamera.IPad, camera)
        assertEquals(MapZoom.atDistance(900.0, latitude = 47.3769, height = 844.0, MapKitCamera.IPad), onTheIPad.zoom, 0.0)
        assertEquals(0.0803, opening.zoom - onTheIPad.zoom, 0.0001)
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
        val distance = (MapZoom.mapKitDistance(12.0, 47.0, 844.0, MapKitCamera.IPhone) + MapZoom.mapKitDistance(14.0, 48.0, 844.0, MapKitCamera.IPhone)) / 2
        assertEquals(MapZoom.atDistance(distance, middle.latitude, 844.0, MapKitCamera.IPhone), halfway.zoom, 1e-9)
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
        fun zoomedBy(levels: Double) = MapCamera.moveMillis(from, position(47.3769, 8.5417, zoom = 15.0 + levels, tilt = 20.0), 956.0, MapKitCamera.IPhone)
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
        val zoom = MapZoom.atDistance(1200.0, latitude = 47.3769, height = 956.0, MapKitCamera.IPhone)
        fun east(km: Double, tilt: Double): Int {
            val longitude = 8.5417 + km / (111.32 * kotlin.math.cos(47.3769 * Math.PI / 180))
            return MapCamera.moveMillis(
                position(47.3769, 8.5417, zoom = zoom, tilt = tilt),
                position(47.3769, longitude, zoom = zoom, tilt = tilt),
                956.0,
                MapKitCamera.IPhone,
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
            MapKitCamera.IPhone,
        )
        assertEquals(670.0, closer.toDouble(), 10.0)
    }

    @Test
    fun onTheIPadAMoveTakesTheSameTimeForTheSameCameraHeight() {
        // MapKit's camera 1200 m above Zürich on the iPad, a map 1376 points tall, moved east: 3 km took 0.67 s,
        // 6 km 1.29 s and 9 km 1.90 s, each with some 30 ms before the first frame, as on the iPhone.
        val height = 1376.0
        val zoom = MapZoom.atDistance(1200.0, latitude = 47.3769, height = height, MapKitCamera.IPad)
        fun east(km: Double, camera: MapKitCamera): Int {
            val longitude = 8.5417 + km / (111.32 * kotlin.math.cos(47.3769 * Math.PI / 180))
            return MapCamera.moveMillis(
                position(47.3769, 8.5417, zoom = zoom, tilt = 0.0),
                position(47.3769, longitude, zoom = zoom, tilt = 0.0),
                height,
                camera,
            )
        }
        assertEquals(640.0, east(3.0, MapKitCamera.IPad).toDouble(), 20.0)
        assertEquals(1260.0, east(6.0, MapKitCamera.IPad).toDouble(), 20.0)
        assertEquals(1870.0, east(9.0, MapKitCamera.IPad).toDouble(), 20.0)
        // The iPhone's camera would stand 6% higher over that map, and cross the same ground sooner.
        assertEquals(592, east(3.0, MapKitCamera.IPhone))
    }

    @Test
    fun aMoveAcrossTheAntimeridianGoesTheShortWay() {
        val halfway = MapCamera.between(position(0.0, 179.0), position(0.0, -179.0), 0.5)

        assertEquals(180.0, abs(halfway.target!!.longitude), 1e-9)
    }

    /** T221's margin: 16 dp from the edge, 380 of panel and 16 to spare, on the panel's side only. */
    @Test
    fun besideAPanelOnlyTheLeadingMarginReachesPastIt() {
        val bounds = ScreenRect(0.0, 0.0, 1280.0, 800.0)
        val panel = ScreenRect(16.0, 40.0, 380.0, 500.0)
        assertEquals(MapInsets(0.0, 16.0 + 380 + 16, 0.0, 0.0), MapCamera.beside(panel, bounds, rightToLeft = false))
        // Right to left the panel is down the right side, and the margin with it.
        val right = ScreenRect(1280.0 - 16 - 380, 40.0, 380.0, 500.0)
        assertEquals(MapInsets(0.0, 0.0, 0.0, 16.0 + 380 + 16), MapCamera.beside(right, bounds, rightToLeft = true))
        // The panel's height, which its fold changes, moves nothing (T229).
        assertEquals(MapCamera.beside(panel, bounds, false), MapCamera.beside(ScreenRect(16.0, 40.0, 380.0, 120.0), bounds, false))
        // Measured from the map's own edge.
        assertEquals(MapInsets(0.0, 380.0 + 16, 0.0, 0.0), MapCamera.beside(panel, ScreenRect(16.0, 0.0, 1264.0, 800.0), false))
    }

    /**
     * A route or a region beside the panel is fitted inside the safe area too, as iOS fits it within the map's layout
     * margins, which UIKit reads back with the safe area added: above a tablet's taskbar, under its status bar.
     */
    @Test
    fun besideAPanelAFitKeepsInsideTheSafeArea() {
        val bounds = ScreenRect(0.0, 0.0, 1280.0, 800.0)
        val margins = MapCamera.beside(ScreenRect(16.0, 40.0, 380.0, 500.0), bounds, rightToLeft = false)
        val safeArea = MapInsets(top = 24.0, left = 0.0, bottom = 48.0, right = 0.0)
        assertEquals(ScreenRect(412.0, 24.0, 868.0, 728.0), MapCamera.within(bounds, margins, safeArea))
        // A side bar for navigation: the panel's margin is past it already, and the other side keeps clear of it.
        val sides = MapInsets(top = 24.0, left = 48.0, bottom = 0.0, right = 48.0)
        assertEquals(ScreenRect(412.0, 24.0, 820.0, 776.0), MapCamera.within(bounds, margins, sides))
        // Without a safe area it is the map inside its margins.
        assertEquals(ScreenRect(412.0, 0.0, 868.0, 800.0), MapCamera.within(bounds, margins, MapInsets.zero))
    }

    /**
     * MAP-044's margins beside the fold of a partly open foldable (ScooterMapView.swift:913-951): past a fold down the
     * map on the side away from the panel, or the trailing one, and above a fold across it, from under the status bar.
     */
    @Test
    fun besideAFoldTheMarginsReachPastItOnTheSideTheMapShowsOn() {
        val book = ScreenRect(465.0, 0.0, 20.0, 669.0)
        val window = ScreenRect(0.0, 0.0, 951.0, 669.0)
        // T244: no panel, and the map shows in the trailing half.
        assertEquals(MapInsets(0.0, 485.0 + 16, 0.0, 0.0), MapCamera.beside(null, book, window, safeTop = 24.0, rightToLeft = false))
        assertEquals(MapInsets(0.0, 0.0, 0.0, 951.0 - 465 + 16), MapCamera.beside(null, book, window, safeTop = 24.0, rightToLeft = true))
        // Beside the panel, the half away from it, whichever side it is on.
        val panel = ScreenRect(16.0, 24.0, 380.0, 400.0)
        assertEquals(MapInsets(0.0, 485.0 + 16, 0.0, 0.0), MapCamera.beside(panel, book, window, safeTop = 24.0, rightToLeft = false))
        val right = ScreenRect(951.0 - 16 - 380, 24.0, 380.0, 400.0)
        assertEquals(MapInsets(0.0, 0.0, 0.0, 951.0 - 465 + 16), MapCamera.beside(right, book, window, safeTop = 24.0, rightToLeft = true))
        // A fold the panel reaches past leaves the panel's margin.
        val near = ScreenRect(300.0, 0.0, 20.0, 669.0)
        assertEquals(MapInsets(0.0, 16.0 + 380 + 16, 0.0, 0.0), MapCamera.beside(panel, near, window, safeTop = 24.0, rightToLeft = false))

        // T245: standing like a laptop, the upright half between the status bar and the fold.
        val laptop = ScreenRect(0.0, 465.0, 669.0, 20.0)
        val upright = ScreenRect(0.0, 0.0, 669.0, 951.0)
        assertEquals(MapInsets(24.0, 0.0, 951.0 - 465 + 16, 0.0), MapCamera.beside(null, laptop, upright, safeTop = 24.0, rightToLeft = false))
    }

    @Test
    fun marginsMeasuredApartInTheirLastDigitsAreTheSame() {
        val margins = MapInsets(0.0, 412.0, 0.0, 0.0)
        assertTrue(margins.nearlyEquals(MapInsets(0.0, 412.4, 0.0, 0.0), within = 0.5))
        assertFalse(margins.nearlyEquals(MapInsets(0.0, 412.5, 0.0, 0.0), within = 0.5))
        assertFalse(margins.nearlyEquals(MapInsets(0.0, 412.0, 1.0, 0.0), within = 0.5))
    }

    private fun position(latitude: Double, longitude: Double, zoom: Double = 10.0, tilt: Double = 0.0, bearing: Double = 0.0) =
        CameraPosition.Builder().target(LatLng(latitude, longitude)).zoom(zoom).tilt(tilt).bearing(bearing).build()
}
